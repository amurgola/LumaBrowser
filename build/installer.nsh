
!include "WinMessages.nsh"
!include "nsDialogs.nsh"
!include "LogicLib.nsh"

Var LumaIdeFound     ; comma-separated IDE folder names found by the scan
!ifndef BUILD_UNINSTALLER
Var LumaVscFound     ; comma-separated VS Code family editors found by the scan
Var LumaIdeInstall   ; checkbox state from the IDE page (${BST_CHECKED} = copy into the JetBrains IDEs)
Var LumaVscInstall   ; checkbox state from the IDE page (${BST_CHECKED} = install into the VS Code editors)
Var LumaIdeDialog
Var LumaIdeCheck
Var LumaVscCheck
!endif

!macro LUMA_STRSTR un
Function ${un}LumaStrStr
  Exch $R1 ; needle
  Exch
  Exch $R2 ; haystack
  Push $R3
  Push $R4
  Push $R5
  StrLen $R3 $R1
  StrCpy $R4 0
  loop:
    StrCpy $R5 $R2 $R3 $R4
    StrCmp $R5 $R1 done
    StrCmp $R5 "" done
    IntOp $R4 $R4 + 1
    Goto loop
  done:
    StrCpy $R1 $R2 "" $R4
    Pop $R5
    Pop $R4
    Pop $R3
    Pop $R2
    Exch $R1
FunctionEnd
!macroend
!ifdef BUILD_UNINSTALLER
  !insertmacro LUMA_STRSTR "un."
!else
  !insertmacro LUMA_STRSTR ""
!endif

!macro LUMA_IDE_SCAN_ROOT root id
  FindFirst $R1 $R2 "${root}\*"
  lumaIde_${id}_loop:
    StrCmp $R2 "" lumaIde_${id}_done
    StrCmp $R2 "." lumaIde_${id}_next
    StrCmp $R2 ".." lumaIde_${id}_next
    IfFileExists "${root}\$R2\options\*.*" 0 lumaIde_${id}_next
    StrCpy $R3 "${root}\$R2\plugins\luma-jetbrains"
    StrCmp $R0 0 0 lumaIde_${id}_notCollect
      StrCpy $LumaIdeFound "$LumaIdeFound$R2, "
      Goto lumaIde_${id}_next
    lumaIde_${id}_notCollect:
    StrCmp $R0 2 0 lumaIde_${id}_notRemove
      RMDir /r "$R3"
      Goto lumaIde_${id}_next
    lumaIde_${id}_notRemove:
    StrCmp $R0 3 0 lumaIde_${id}_copy
      IfFileExists "$R3\luma-plugin.json" lumaIde_${id}_copy lumaIde_${id}_next
    lumaIde_${id}_copy:
      RMDir /r "$R3"
      CreateDirectory "$R3"
      CopyFiles /SILENT "$INSTDIR\resources\ide\luma-jetbrains\*.*" "$R3"
      FileOpen $R4 "$R3\luma-plugin.json" w
      FileWrite $R4 '{"version":"${VERSION}","appVersion":"${VERSION}","installedAt":"installer"}'
      FileClose $R4
    lumaIde_${id}_next:
    FindNext $R1 $R2
    Goto lumaIde_${id}_loop
  lumaIde_${id}_done:
  FindClose $R1
!macroend

!macro LUMA_IDE_FOREACH un
Function ${un}LumaIdeForEach
  Exch $R0 ; mode
  Push $R1
  Push $R2
  Push $R3
  Push $R4
  !insertmacro LUMA_IDE_SCAN_ROOT "$APPDATA\JetBrains" jb
  !insertmacro LUMA_IDE_SCAN_ROOT "$APPDATA\Google" goog
  Pop $R4
  Pop $R3
  Pop $R2
  Pop $R1
  Pop $R0
FunctionEnd
!macroend
!ifdef BUILD_UNINSTALLER
  !insertmacro LUMA_IDE_FOREACH "un."
!else
  !insertmacro LUMA_IDE_FOREACH ""
!endif

!define LUMA_VSC_ID "lumabyte.luma-vscode"
!macro LUMA_VSC_EDITOR label cli dataDir id
  IfFileExists "${cli}" 0 lumaVsc_${id}_next
    StrCmp $R0 2 0 lumaVsc_${id}_notRemove
      nsExec::Exec /TIMEOUT=120000 '"$SYSDIR\cmd.exe" /d /s /c ""${cli}" --uninstall-extension ${LUMA_VSC_ID}"'
      Pop $R1
      Goto lumaVsc_${id}_next
    lumaVsc_${id}_notRemove:
!ifndef BUILD_UNINSTALLER
    StrCmp $R0 0 0 lumaVsc_${id}_notCollect
      StrCpy $LumaVscFound "$LumaVscFound${label}, "
      Goto lumaVsc_${id}_next
    lumaVsc_${id}_notCollect:
    StrCmp $R0 3 0 lumaVsc_${id}_install
      IfFileExists "$PROFILE\${dataDir}\extensions\${LUMA_VSC_ID}-*" lumaVsc_${id}_install lumaVsc_${id}_next
    lumaVsc_${id}_install:
      nsExec::Exec /TIMEOUT=120000 '"$SYSDIR\cmd.exe" /d /s /c ""${cli}" --install-extension "$INSTDIR\resources\ide\luma-vscode.vsix" --force"'
      Pop $R1
!endif
  lumaVsc_${id}_next:
!macroend

!macro LUMA_VSC_FOREACH un
Function ${un}LumaVscForEach
  Exch $R0 ; mode
  Push $R1
  !insertmacro LUMA_VSC_EDITOR "VS Code" "$LOCALAPPDATA\Programs\Microsoft VS Code\bin\code.cmd" ".vscode" codeU
  !insertmacro LUMA_VSC_EDITOR "VS Code" "$PROGRAMFILES64\Microsoft VS Code\bin\code.cmd" ".vscode" codeM
  !insertmacro LUMA_VSC_EDITOR "VS Code Insiders" "$LOCALAPPDATA\Programs\Microsoft VS Code Insiders\bin\code-insiders.cmd" ".vscode-insiders" insU
  !insertmacro LUMA_VSC_EDITOR "VS Code Insiders" "$PROGRAMFILES64\Microsoft VS Code Insiders\bin\code-insiders.cmd" ".vscode-insiders" insM
  !insertmacro LUMA_VSC_EDITOR "VSCodium" "$LOCALAPPDATA\Programs\VSCodium\bin\codium.cmd" ".vscode-oss" codiumU
  !insertmacro LUMA_VSC_EDITOR "VSCodium" "$PROGRAMFILES64\VSCodium\bin\codium.cmd" ".vscode-oss" codiumM
  !insertmacro LUMA_VSC_EDITOR "Cursor" "$LOCALAPPDATA\Programs\cursor\resources\app\bin\cursor.cmd" ".cursor" cursorU
  !insertmacro LUMA_VSC_EDITOR "Cursor" "$PROGRAMFILES64\cursor\resources\app\bin\cursor.cmd" ".cursor" cursorM
  !insertmacro LUMA_VSC_EDITOR "Windsurf" "$LOCALAPPDATA\Programs\Windsurf\bin\windsurf.cmd" ".windsurf" surfU
  !insertmacro LUMA_VSC_EDITOR "Windsurf" "$PROGRAMFILES64\Windsurf\bin\windsurf.cmd" ".windsurf" surfM
  Pop $R1
  Pop $R0
FunctionEnd
!macroend
!ifdef BUILD_UNINSTALLER
  !insertmacro LUMA_VSC_FOREACH "un."
!else
  !insertmacro LUMA_VSC_FOREACH ""
!endif

!macro customPageAfterChangeDir
!ifndef BUILD_UNINSTALLER
Function LumaIdePageCreate
  ${if} ${isUpdated}
    Abort
  ${endif}
  StrCpy $LumaIdeFound ""
  Push 0
  Call LumaIdeForEach
  StrCpy $LumaVscFound ""
  Push 0
  Call LumaVscForEach
  StrCmp "$LumaIdeFound$LumaVscFound" "" 0 lumaIdePageShow
    Abort
  lumaIdePageShow:
  !insertmacro MUI_HEADER_TEXT "Your code editors" "Add Luma to your IDEs and editors"
  nsDialogs::Create 1018
  Pop $LumaIdeDialog
  StrCmp $LumaIdeDialog error 0 lumaIdePageBuilt
    Abort
  lumaIdePageBuilt:
  StrCpy $LumaIdeCheck 0
  StrCpy $LumaVscCheck 0
  StrCpy $1 0 ; running y offset, in dialog units
  StrCmp $LumaIdeFound "" lumaIdePageNoJb
    StrCpy $LumaIdeFound $LumaIdeFound -2 ; drop the trailing ", "
    ${NSD_CreateLabel} 0 $1u 100% 20u "JetBrains IDEs found for your user account: $LumaIdeFound"
    Pop $0
    IntOp $1 $1 + 22
    ${NSD_CreateCheckbox} 0 $1u 100% 12u "Install the LumaBrowser plugin into them (restart the IDE afterwards)"
    Pop $LumaIdeCheck
    ${NSD_SetState} $LumaIdeCheck ${BST_CHECKED}
    IntOp $1 $1 + 20
  lumaIdePageNoJb:
  StrCmp $LumaVscFound "" lumaIdePageNoVsc
    StrCpy $LumaVscFound $LumaVscFound -2
    ${NSD_CreateLabel} 0 $1u 100% 20u "VS Code family editors found on this machine: $LumaVscFound"
    Pop $0
    IntOp $1 $1 + 22
    ${NSD_CreateCheckbox} 0 $1u 100% 12u "Install the LumaBrowser extension into them (reload the editor afterwards)"
    Pop $LumaVscCheck
    ${NSD_SetState} $LumaVscCheck ${BST_CHECKED}
    IntOp $1 $1 + 20
  lumaIdePageNoVsc:
  ${NSD_CreateLabel} 0 $1u 100% 40u "Both add the same Luma chat: the Code agent works on the open project with your local models, and its edits land in the editor. You can also do this later from Settings > General."
  Pop $0
  nsDialogs::Show
FunctionEnd

Function LumaIdePageLeave
  StrCpy $LumaIdeInstall 0
  StrCpy $LumaVscInstall 0
  StrCmp $LumaIdeCheck 0 +2
    ${NSD_GetState} $LumaIdeCheck $LumaIdeInstall
  StrCmp $LumaVscCheck 0 +2
    ${NSD_GetState} $LumaVscCheck $LumaVscInstall
FunctionEnd

Page custom LumaIdePageCreate LumaIdePageLeave
!endif
!macroend

!define LUMA_CLI_BASE "$LOCALAPPDATA\LumaBrowser"
!define LUMA_CLI_BIN "${LUMA_CLI_BASE}\bin"
!define LUMA_CLI_DIR "${LUMA_CLI_BASE}\cli"

!macro customInstall
  nsExec::Exec 'netsh advfirewall firewall delete rule name="LumaBrowser LAN Sharing"'
  nsExec::Exec 'netsh advfirewall firewall add rule name="LumaBrowser LAN Sharing" dir=in action=allow program="$INSTDIR\${APP_EXECUTABLE_FILENAME}" enable=yes profile=private,domain'

  RMDir /r "${LUMA_CLI_DIR}"
  CreateDirectory "${LUMA_CLI_DIR}"
  CopyFiles /SILENT "$INSTDIR\resources\cli\*.*" "${LUMA_CLI_DIR}"
  FileOpen $0 "${LUMA_CLI_DIR}\.app-version" w
  FileWrite $0 "${VERSION}"
  FileClose $0

  CreateDirectory "${LUMA_CLI_BIN}"
  FileOpen $0 "${LUMA_CLI_BIN}\luma.cmd" w
  FileWrite $0 "@echo off$\r$\n"
  FileWrite $0 "setlocal$\r$\n"
  FileWrite $0 'set "ELECTRON_RUN_AS_NODE=1"$\r$\n'
  FileWrite $0 '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "${LUMA_CLI_DIR}\bin\luma.js" %*$\r$\n'
  FileWrite $0 "exit /b %ERRORLEVEL%$\r$\n"
  FileClose $0

  ReadRegStr $1 HKCU "Environment" "Path"
  Push "$1;"
  Push "${LUMA_CLI_BIN};"
  Call LumaStrStr
  Pop $2
  StrCmp $2 "" 0 lumaPathDone
    StrCmp $1 "" 0 +3
      StrCpy $1 "${LUMA_CLI_BIN}"
      Goto +2
      StrCpy $1 "$1;${LUMA_CLI_BIN}"
    WriteRegExpandStr HKCU "Environment" "Path" "$1"
    SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
  lumaPathDone:

  IfFileExists "$INSTDIR\resources\ide\luma-jetbrains\lib\*.*" 0 lumaIdeDone
    StrCmp $LumaIdeInstall ${BST_CHECKED} lumaIdeAll
      Push 3
      Call LumaIdeForEach
      Goto lumaIdeDone
    lumaIdeAll:
      Push 1
      Call LumaIdeForEach
  lumaIdeDone:

  IfFileExists "$INSTDIR\resources\ide\luma-vscode.vsix" 0 lumaVscDone
    StrCmp $LumaVscInstall ${BST_CHECKED} lumaVscAll
      Push 3
      Call LumaVscForEach
      Goto lumaVscDone
    lumaVscAll:
      Push 1
      Call LumaVscForEach
  lumaVscDone:
!macroend

!macro customUnInstall
  nsExec::Exec 'netsh advfirewall firewall delete rule name="LumaBrowser LAN Sharing"'

  Push 2
  Call un.LumaIdeForEach

  Push 2
  Call un.LumaVscForEach

  Delete "${LUMA_CLI_BIN}\luma.cmd"
  RMDir "${LUMA_CLI_BIN}"
  RMDir /r "${LUMA_CLI_DIR}"

  ReadRegStr $1 HKCU "Environment" "Path"
  StrCpy $2 "$1;"
  Push "$2"
  Push "${LUMA_CLI_BIN};"
  Call un.LumaStrStr
  Pop $3
  StrCmp $3 "" lumaUnPathDone
    StrLen $4 "$2"
    StrLen $5 "$3"
    IntOp $6 $4 - $5
    StrCpy $7 "$2" $6
    StrLen $8 "${LUMA_CLI_BIN};"
    StrCpy $9 "$3" "" $8
    StrCpy $1 "$7$9"
    StrCpy $R0 "$1" 1 -1
    StrCmp $R0 ";" 0 +2
      StrCpy $1 "$1" -1
    WriteRegExpandStr HKCU "Environment" "Path" "$1"
    SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
  lumaUnPathDone:
!macroend
