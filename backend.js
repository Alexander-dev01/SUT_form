const http = require('http')
const path = require('path')
const fs = require('fs')
const ExcelJS = require('exceljs')
const dotenv = require('dotenv')

dotenv.config()

const port = process.env.PORT || 5001
const fileName = 'Users.xlsx'
const fullPath = path.join(__dirname, '..', fileName)

const HEADERS = [
  'id',
  'Фамилия',
  'Имя',
  'Отчество',
  'Участвовал в олимпиадах',
  'Дата отправки'
]

async function appendToExcel(data) {
  const workbook = new ExcelJS.Workbook()

  if (fs.existsSync(fullPath)) {
    await workbook.xlsx.readFile(fullPath)
  }

  let worksheet = workbook.getWorksheet('Заявки')

  if (!worksheet) {
    worksheet = workbook.addWorksheet('Заявки')
    worksheet.addRow(HEADERS)
  }

  worksheet.addRow([
    data.id,
    data.familia,
    data.imya,
    data.otcestvo,
    data.olimpidada === 'da' ? 'Да' : 'Нет', 
    new Date().toLocaleString('ru-RU')
  ])

  await workbook.xlsx.writeFile(fullPath)
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'POST') {
    let dataFull = ''

    req.on('data', (chunk) => {
      dataFull += chunk.toString()
    })

    req.on('end', async () => {
      try {
        dataFull = JSON.parse(dataFull)
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Некорректный JSON' }))
        return
      }

      try {
        await appendToExcel(dataFull)

        console.log('Запись добавлена в Excel:', dataFull)

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          message: 'Заявка сохранена в Excel',
          data: dataFull
        }))
      } catch (err) {
        console.error('Ошибка записи в Excel:', err)

        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Не удалось записать в Excel' }))
      }
    })

    req.on('error', (err) => {
      console.error('Ошибка чтения запроса:', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Ошибка сервера' }))
    })

    return
  }

  res.writeHead(405, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Разрешены только POST-запросы' }))
})

server.listen(port, '0.0.0.0', () => {
  console.log('==== Сервер запущен ====')
  console.log(`==== Порт: ${port} ====`)
})















