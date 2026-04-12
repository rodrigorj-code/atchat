#!/bin/bash
#
# Print banner art.

#######################################
# Print a board.
# Globals:
#   BG_BROWN
#   NC
#   WHITE
#   CYAN_LIGHT
#   RED
#   GREEN
#   YELLOW
# Arguments:
#   None
#######################################
print_banner() {
  clear

  printf "${GREEN}";
  printf "  _____            _____ _\n";
  printf " / ____|          |  ___| |\n";
  printf "| |     ___   ___ | |_  | | _____  __\n";
  printf "| |    / _ \\ / _ \\|  _| | |/ _ \\ \\/ /\n";
  printf "| |___| (_) | (_) | | | | |  __/>  <\n";
  printf " \\_____\\___/ \\___/|_| |_|_|\\___/_/\\_\\\n";
  printf "\n";
  printf "Documentação e suporte: consulte o README do projeto.\n";

  printf "\n"

  printf "${NC}";

  printf "\n"
}
