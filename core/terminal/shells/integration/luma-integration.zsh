# LumaBrowser shell integration for zsh. The terminal starts zsh with ZDOTDIR pointing at a folder whose startup
# files all load this file with the stage's name (zshenv, zprofile, zshrc, zlogin). Each stage hands over to the
# user's own file of that name; zshrc then adds the OSC 633 marks around the prompt and every command.

__luma_stage=$1
__luma_user_dir=${LUMA_USER_ZDOTDIR:-$HOME}

# zsh looks for the next startup file in ZDOTDIR, so the user's file runs with their own value and ours is put back
# until the last stage has run.
__luma_own_dir=$ZDOTDIR
if [[ -n $LUMA_USER_ZDOTDIR ]]; then ZDOTDIR=$LUMA_USER_ZDOTDIR; else unset ZDOTDIR; fi
[[ -r $__luma_user_dir/.$__luma_stage ]] && . $__luma_user_dir/.$__luma_stage
if [[ $__luma_stage == zlogin || ( $__luma_stage == zshrc && ! -o login ) ]]; then
  unset LUMA_USER_ZDOTDIR
else
  ZDOTDIR=$__luma_own_dir
fi
unset __luma_own_dir __luma_user_dir

if [[ $__luma_stage == zshrc && -z $__LUMA_INTEGRATION ]]; then
  __LUMA_INTEGRATION=1

  # Backslash, semicolon and newline would end or split a mark, so they travel as \\, \x3b and \x0a.
  __luma_escape() {
    local text=${1//\\/\\\\}
    text=${text//;/\\x3b}
    print -rn -- ${text//$'\n'/\\x0a}
  }

  __luma_precmd() {
    local code=$?
    [[ -n $__luma_ran ]] && print -n "\e]633;D;$code\a"
    __luma_ran=
    print -n "\e]633;P;Cwd=$(__luma_escape $PWD)\a\e]633;A\a"
    # A prompt theme may rebuild PS1 on every prompt, so the end mark goes on again when it is missing.
    [[ $PS1 == *'633;B'* ]] || PS1="$PS1%{"$'\e]633;B\a'"%}"
  }

  __luma_preexec() {
    __luma_ran=1
    print -n "\e]633;E;$(__luma_escape $1)\a\e]633;C\a"
  }

  autoload -Uz add-zsh-hook
  add-zsh-hook precmd __luma_precmd
  add-zsh-hook preexec __luma_preexec

  if [[ -n $LUMA_STARTUP_COMMAND ]]; then
    __luma_startup=$LUMA_STARTUP_COMMAND
    unset LUMA_STARTUP_COMMAND
    eval $__luma_startup
    unset __luma_startup
  fi
fi
unset __luma_stage
