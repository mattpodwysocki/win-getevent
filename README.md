# win-getevent - Node.js wrapper for the PowerShell Get-WinEvent CmdLet

This module is a wrapper around the [PowerShell `Win-GetEvent` CmdLet](https://technet.microsoft.com/en-us/library/hh849682.aspx) which provides a simple API to query event logs and event tracing logs on Windows.  This module requires Windows 7+ to be installed with PowerShell v2 and Node.js 4+.

# Getting Started

## Installation

To install `win-getevent` via NPM:
```bash
npm install win-getevent --save
```

## Usage

You can create a new `WinEventEmitter` by doing the following:
```js
const WinEventEmitter = require('win-getevent').WinEventEmitter;

const winEmitter = new WinEventEmitter({
  providers: ['MMicrosoft-Windows-GroupPolicy'],
  // or use LogName filter, defaults to 'System','Setup','Application','Security'
  // logNames: ['Application']
  frequency: 1000 /* ms */
});

winEmitter.on('data', logs => {
  // Contains an array of log objects
  logs.forEach(log => {
    console.dir(log);
  });
});

winEmitter.on('error', err => {
  console.log(`Error: ${err}`);
});

winEmitter.on('end', () => {
  console.log('Ended');
});

// Start polling
winEmitter.start();

...
// When you want to stop which emits the 'end' event
winEmitter.stop();
```

The options for creating a new `WinEventEmitter` are as follows:
- `providers`: `Array<string>` - An array of provider names.  If not specified, logNames defaults apply.
- `logNames`: `Array<string>` - An array of LogName strings.  If not specified, defaults to `['System','Security','Application','Setuo']`.
- `frequency`: `Number`: - The polling frequency in milliseconds to query the underlying system.  If not specified, defaults to `10000` or 10 seconds.
- `maxEvents`: `Number` - The maximum number of events to receive in one batch.  If not specified, defaults to `100`.
- `startTime`: `Date` - The start time for querying `Get-WinEvent`. If not specified, defaults to now, `new Date()`.
- `endTime`: `Date` - The end time for querying `Get-WinEvent`. If not specified, defaults to now + frequency, `new Date(Date.now() + frequency)`.
- `computerName`: `String` - Optional computer name for querying `Get-WinEvent`.
- `userName`: `String` - Optional user name for logging into a remote machine.
- `password`: `String` - Optional password for logging into a remote machine.

The data returned from the logs are in the following is an array with each object in this JSON format:
- `id`: `Number` - The event ID.
- `providerName`: `String` - The event provider name such as `'Microsoft-Windows-GroupPolicy'`
- `providerId`: `String` - The event provider GUID.
- `logName`: `String` - The log name such as `System`
- `processId`: `Number` - The process ID.
- `threadId`: `Number` - The thread ID.
- `machineName`: `String` - The machine name.
- `timeCreated`: `Date` - The date of the event.
- `levelDisplayName`: `String` - The level display name for the event such as `'Information'` 
- `message`: `String` - The event message.

# Contributing

By contributing or commenting on issues in this repository, whether you've read them or not, you're agreeing to the [Contributor Code of Conduct](CODE_OF_CONDUCT.md). Much like traffic laws, ignorance doesn't grant you immunity.

Contributions are welcome for the following:
- Code improvements
- Documentation
- Unit tests

Please conform to our settings in our ESLint and EditorConfig settings.

# LICENSE

The MIT License (MIT)

Copyright (c) 2016 Matthew Podwysocki

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
