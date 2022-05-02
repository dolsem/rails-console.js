#!/usr/bin/env ruby

ENV['DISABLE_PRY_RAILS'] = '0'
ENV['IRBRC'] = File.expand_path('irbrc.rb', __dir__)

ROOT_PATH = ENV['RAILS_ROOT']
APP_PATH = File.expand_path('./config/application', ROOT_PATH)

begin
  load File.expand_path('bin/spring', ROOT_PATH)
rescue LoadError => e
  raise unless e.message.include?('spring')
end

require File.expand_path('./config/boot', ROOT_PATH)
require 'rails/command'

Rails::Command.invoke 'console', []
