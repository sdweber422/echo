import email from 'emailjs'
import tmp from 'tmp'
import config from 'src/config'
import {writeCSV} from 'src/server/reports/util'

const fs = require('fs')

const {reports, smtp} = config

const fromAddress = 'no-reply@learnersguild.org'

const cycleFormationMessage = (filePath, cycleNumber) => {
  return {
    from: `Cycle ${cycleNumber} Formation Report ${fromAddress}`,
    to: reports.projectTeams.email,
    subject: `Analysis Report for cycle ${cycleNumber}`,
    text: `The attached file contains the formation report for cycle ${cycleNumber}.`,
    html: (
      `<p>The attached file contains the formation report for cycle ${cycleNumber}.</p>`
    ),
    attachment: {
      path: filePath,
      name: `Cycle-${cycleNumber}-Formation-Report.csv`
    }
  }
}

const options = {
  host: smtp.host,
  port: smtp.port,
  ssl: false
}

const server = email.server.connect(options)

export function sendCycleFormationReport(report, cycleNumber) {
  const tmpFile = tmp.fileSync({
    prefix: `cycle-${cycleNumber}-formation-report-`,
    postfix: '.csv'
  })
  const writeStream = fs.createWriteStream(tmpFile.name)
  writeCSV(report, writeStream)

  return server.send(cycleFormationMessage(tmpFile.name, cycleNumber), (err, message) => {
    tmpFile.removeCallback()
    console.log(err || message)
  })
}
