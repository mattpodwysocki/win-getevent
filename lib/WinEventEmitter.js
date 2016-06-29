'use strict';

const EventEmitter = require('events').EventEmitter;
const execSync = require('child_process').execSync;
const os = require('os');

function convertPowershellDate(date) {
  const parts = date.toString().split(' ');
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]} ${parts[4]}`;
}

function processLogEvent(event) {
  console.log('event', event);
  let createdAtMilis = event.TimeCreated.replace(/\//g, '').replace('Date(', '').replace(')', '');
  createdAtMilis = parseInt(createdAtMilis, 10);
  return {
    id: event.Id,
    providerName: event.ProviderName,
    providerId: event.ProviderId,
    logName: event.LogName,
    processId: event.ProcessId,
    threadId: event.threadId,
    machineName: event.MachineName,
    timeCreated: new Date(createdAtMilis),
    levelDisplayName: event.LevelDisplayName,
    message: event.Message
  };
}

function parseLogData(data) {
  let events;
  try {
    events = JSON.parse(data);
  } catch (e) {
    throw e;
  }

  return Array.isArray(events) ?
    events.map(event => processLogEvent(event)) :
    [processLogEvent(events)];
}

class WinEventEmitter extends EventEmitter {
  constructor (options) {
    super();

    if (!/win/gi.test(os.platform())) {
      throw new Error('Only Windows is supported');
    }

    const defaultOptions = {
      providers: ['Microsoft-Windows-DNS-Client'],
      maxEvents: 100,
      frequency: 10000
    };
    this.options = Object.assign({}, defaultOptions, options);
    this.options.startTime || (this.options.startTime = new Date());
    this.options.endTime  || (this.options.endTime = new Date(Date.now() + this.options.frequency));
  }

  start () {
    setTimeout(() => {
      const providers = `'${this.options.providers.join('\', \'')}'`;
      const startTime = convertPowershellDate(this.options.startTime), endTime = convertPowershellDate(this.options.endTime);

      let powershellCmd = `powershell "Get-WinEvent -FilterHashTable @{ProviderName=${providers}; StartTime='${startTime}'; EndTime='${endTime}';} -MaxEvents ${this.options.maxEvents}`;

      if (this.options.computerName) {
        powershellCmd += ` -ComputerName ${this.options.computerName}`;
      }

      powershellCmd += ' | ConvertTo-Json"';

      let data;
      try {
        data = execSync(powershellCmd, {stdio: [1]}).toString();
      } catch (e) {
        // Ignore missing events
        if (!e.message.indexOf('NoMatchingEventsFound,Microsoft.PowerShell.Commands.GetWinEventCommand')) {
          this.emit('error', e);
        }
      }

      if (data) {
        this.emit('data', parseLogData(data));
      }

      if (this._stop) { return; }

      this.options.startTime = new Date(Date.now());
      this.options.endTime = new Date(Date.now() + this.options.frequency);
      this.start();
    }, this.options.frequency);
  }

  stop () {
    this._stop = true;
    this.emit('close');
  }
}

module.exports = WinEventEmitter;
