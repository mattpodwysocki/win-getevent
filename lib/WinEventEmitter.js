'use strict';

const EventEmitter = require('events').EventEmitter;
const exec = require('child_process').exec;

function convertPowershellDate(date) {
  const parts = date.toString().split(' ');
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]} ${parts[4]}`;
}

function processLogEvent(event) {
  console.log('event', event);
  const createdAtMilis = event.TimeCreated.replace(/\//g, '').replace('Date(', '').replace(')', '');
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

  const processedEvents = [];
  if (!Array.isArray(events)) {
    let event = events;
    processedEvents.push(processLogEvent(event));
  } else {
    events.forEach(event => {
      processedEvents.push(processLogEvent(event));
    });
  }

  return processedEvents;
}

class WinEventEmitter extends EventEmitter {
  constructor (options) {
    super();
    const defaultOptions = {
      providers: ['Microsoft-Windows-DNS-Client'],
      maxEvents: 100,
      endTime: new Date(Date.now()),
      startTime: new Date(Date.now()),
      frequency: 10000
    }
    this.options = Object.assign({}, defaultOptions, options);
  }

  start () {
    setTimeout(() => {
      const providers = this.options.providers.join(', ');
      const startTime = convertPowershellDate(this.options.startTime), endTime = convertPowershellDate(this.options.endTime);

      let powershellCmd = `powershell "Get-WinEvent -FilterHashTable @{ProviderName='${providers}'; StartTime='${startTime}'; EndTime='${endTime}'; } -MaxEvents ${this.options.maxEvents}`;

      if (this.options.computerName) {
        powershellCmd += ` -ComputerName ${this.options.computerName}`;
      }

      powershellCmd += ' | ConvertTo-Json"';

      console.log(powershellCmd);

      this.powershell = exec(powershellCmd);
      let eventRawData = '';

      this.powershell.stdout.on('data', data => {
        eventRawData += data;
      });

      this.powershell.stderr.on('data', error => {
        this.emit('error', new Error(error));
      });

      this.powershell.on('close', code => {
        if (eventRawData) {
          this.emit('data', parseLogData(eventRawData));
        }

        if (this._stop) { return; }

        this.options.startTime = new Date(Date.now());
        this.options.endTime = new Date(Date.now() + this.options.frequency);
        this.start();
      });
    }, this.options.frequency);
  }

  stop () {
    this._stop = true;
    this.powershell.kill();
    this.emit('close');
  }
}

module.exports = WinEventEmitter;
