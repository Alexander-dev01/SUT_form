const http = require('http')
const path = require('path')
const fs = require('fs')
const ExcelJS = require('exceljs')
const dotenv = require('dotenv')
dotenv.config()

const ADMIN_PASSWORD = process.env.PASSWORDEXCEL

const port = process.env.PORT || 5001
const fileName = 'Users.xlsx'
const fullPath = path.join(__dirname, '..', fileName)

const HEADERS = [
  'id',
  'Секция',
  'Подсекция',
  'Фамилия',
  'Имя',
  'Отчество',
  'Телефон',
  'Email',
  'Образовательное учреждение',
  'Класс',
  'Название работы',
  'Количество баллов',
  'Ссылка на фото работы',
  'Фамилия руководителя',
  'Имя руководителя',
  'Отчество руководителя',
  'Фамилия сопровождающего',
  'Имя сопровождающего',
  'Отчество сопровождающего',
  'Дата отправки'
]

function getRowData(data) {
  return [
    data.id ?? '',
    data.sekcia ?? '',
    data.podsekcia ?? '',
    data.familia ?? '',
    data.imya ?? '',
    data.otcestvo ?? '',
    data.tel ?? '',
    data.email ?? '',
    data.schule ?? '',
    data.klass ?? '',
    data.rabota ?? '',
    data.balls ?? '',
    data.foto ?? '',
    data.familiaR ?? '',
    data.imyaR ?? '',
    data.otcestvoR ?? '',
    data.familiaS ?? '',
    data.imyaS ?? '',
    data.otcestvoS ?? '',
    new Date().toLocaleString('ru-RU')
  ]
}

function findExistingId(worksheet, id) {
  if (!id) {
    return false
  }

  const idColumn = worksheet.getColumn(1)
  const values = idColumn.values

  return values.some((value) => String(value) === String(id))
}

function appendToExcel(data) {
  const workbook = new ExcelJS.Workbook()

  const readFilePromise = fs.existsSync(fullPath)
    ? workbook.xlsx.readFile(fullPath)
    : Promise.resolve()

  return readFilePromise
    .then(() => {
      let worksheet = workbook.getWorksheet('Заявки')

      if (!worksheet) {
        worksheet = workbook.addWorksheet('Заявки')
        worksheet.addRow(HEADERS)
      }

      const isAlreadyCreated = findExistingId(worksheet, data.id)

      if (isAlreadyCreated) {
        return {
          created: false,
          message: 'Заявка с таким id уже создана'
        }
      }

      worksheet.addRow(getRowData(data))

      return workbook.xlsx.writeFile(fullPath).then(() => {
        return {
          created: true,
          message: `Спасибо, ${data.imya}, заявка сохранена!`
        }
      })
    })
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // скачивание excel
  if (req.method === 'GET' && req.url === '/download') {
    if (!fs.existsSync(fullPath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Файл Excel ещё не создан' }))
      return
    }

    res.writeHead(200, {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Users.xlsx"'
    })

    const fileStream = fs.createReadStream(fullPath)
    fileStream.pipe(res)

    fileStream.on('error', (err) => {
      console.error('Ошибка чтения Excel:', err)

      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
      }

      res.end(JSON.stringify({ error: 'Не удалось скачать файл' }))
    })

    return
  }

  if (req.method === 'POST' && req.url === '/check-password') {
    let body = ''

    req.on('data', (chunk) => {
      body += chunk.toString()
    })

    req.on('end', () => {
      let data

      try {
        data = JSON.parse(body)
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Некорректный JSON' }))
        return
      }

      const password = String(data.password ?? '')
      const correctPassword = String(ADMIN_PASSWORD)
      console.log('correctPassword=============', correctPassword);

      let isSuccess = false

      if (password === correctPassword) {
        isSuccess = true
      }

      if (isSuccess) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          success: true,
          message: 'Пароль совпал'
        }))
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          success: false,
          message: 'Пароль не совпал'
        }))
      }
    })

    return
  }

  if (req.method === 'POST') {
    let dataFull = ''

    req.on('data', (chunk) => {
      dataFull += chunk.toString()
    })

    req.on('end', () => {
      try {
        dataFull = JSON.parse(dataFull)
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Некорректный JSON' }))
        return
      }

      console.log('datafull', dataFull)

      appendToExcel(dataFull)
        .then((result) => {
          console.log(result.message, dataFull)

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            message: result.message,
            created: result.created,
            data: dataFull
          }))
        })
        .catch((err) => {
          console.error('Ошибка записи в Excel:', err)

          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Не удалось записать в Excel' }))
        })
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