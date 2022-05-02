IRB.conf[:SAVE_HISTORY] = 0
IRB.conf[:PROMPT] = {}
IRB.conf[:PROMPT][:RAILSCONSOLEJS] = {
  :PROMPT_I => "I|\uFAD0>",
  :PROMPT_N => "N|\uFAD0>",
  :PROMPT_S => "S|\uFAD0>",
  :PROMPT_C => "C|\uFAD0>",
  :RETURN   => "R|\uFAD0>%s\n"
}
IRB.conf[:PROMPT_MODE] = :RAILSCONSOLEJS
