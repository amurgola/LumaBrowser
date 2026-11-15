# LumaBrowser shell integration for bash, loaded with --init-file. Marks the prompt and each command with OSC 633 so
# the terminal knows when a command starts and ends, its exit code and the working directory. --init-file replaces
# bash's own startup files, so they are read here first.

if [ -n "$__LUMA_INTEGRATION" ]; then return; fi
__LUMA_INTEGRATION=1

if [ -n "$LUMA_BASH_LOGIN" ]; then
  [ -r /etc/profile ] && . /etc/profile
  for __luma_file in ~/.bash_profile ~/.bash_login ~/.profile; do
    if [ -r "$__luma_file" ]; then . "$__luma_file"; break; fi
  done
  unset __luma_file
else
  [ -r ~/.bashrc ] && . ~/.bashrc
fi

__luma_first_prompt=1
__luma_last_pwd=
__luma_cwd=

# Backslash and semicolon would end or split a mark, so they travel as \\ and \x3b.
__luma_escape() {
  local text=$1
  text=${text//\\/\\\\}
  text=${text//;/\\x3b}
  printf '%s' "$text"
}

# Git Bash on Windows shows /c/Users/me; the terminal needs C:\Users\me to reopen there.
__luma_report_cwd() {
  if [ "$PWD" != "$__luma_last_pwd" ]; then
    __luma_last_pwd=$PWD
    if command -v cygpath >/dev/null 2>&1; then __luma_cwd=$(cygpath -w "$PWD"); else __luma_cwd=$PWD; fi
  fi
  printf '\033]633;P;Cwd=%s\007' "$(__luma_escape "$__luma_cwd")"
}

# Runs first in PROMPT_COMMAND so $? is still the command's own.
__luma_precmd() {
  local code=$?
  if [ -z "$__luma_first_prompt" ]; then printf '\033]633;D;%s\007' "$code"; fi
  __luma_first_prompt=
  __luma_report_cwd
  return $code
}

# Runs last in PROMPT_COMMAND: a prompt theme may have rebuilt PS1, so the marks go on again when they are missing.
__luma_wrap_prompt() {
  case $PS1 in
    *'633;A'*) ;;
    *) PS1='\[\033]633;A\007\]'"$PS1"'\[\033]633;B\007\]' ;;
  esac
}

if [ "$(declare -p PROMPT_COMMAND 2>/dev/null | cut -c1-10)" = 'declare -a' ]; then
  PROMPT_COMMAND=(__luma_precmd "${PROMPT_COMMAND[@]}" __luma_wrap_prompt)
else
  __luma_existing=${PROMPT_COMMAND%"${PROMPT_COMMAND##*[![:space:];]}"}
  PROMPT_COMMAND="__luma_precmd${__luma_existing:+; $__luma_existing}; __luma_wrap_prompt"
  unset __luma_existing
fi

# PS0 is printed after a command line is read and before it runs (bash 4.4 and later).
PS0='\033]633;C\007'"${PS0-}"

if [ -n "$LUMA_STARTUP_COMMAND" ]; then
  __luma_startup=$LUMA_STARTUP_COMMAND
  unset LUMA_STARTUP_COMMAND
  eval "$__luma_startup"
  unset __luma_startup
fi
