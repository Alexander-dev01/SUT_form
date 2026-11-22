const http = require('http')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const ExcelJS = require('exceljs')
const dotenv = require('dotenv')

dotenv.config()

const ADMIN_PASSWORD = process.env.PASSWORDEXCEL
const port = process.env.PORT || 5001
const fileName = 'Users.xlsx'
const fullPath = path.join(__dirname, '..', fileName)

if (!ADMIN_PASSWORD) {
  console.error('Ошибка: не задана переменная окружения PASSWORDEXCEL')
  process.exit(1)
}

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
    formatDateTime()
  ]
}

function formatDateTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')

  return (
    `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

function findExistingId(worksheet, id) {
  if (!id) {
    return false
  }

  const idColumn = worksheet.getColumn(1)
  const values = idColumn.values

  return values.some((value) => String(value) === String(id))
}

let writeQueue = Promise.resolve()

function appendToExcel(data) {
  const task = writeQueue.then(() => {
    const workbook = new ExcelJS.Workbook()

    const readFilePromise = fs.existsSync(fullPath)
      ? workbook.xlsx.readFile(fullPath)
      : Promise.resolve()

    return readFilePromise.then(() => {
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

      return workbook.xlsx.writeFile(fullPath).then(() => ({
        created: true,
        message: `Спасибо, ${data.imya}, заявка сохранена!`
      }))
    })
  })

  writeQueue = task.catch((error) => {
    console.error('Ошибка записи в Excel:', error)
  })

  return task
}

function isPasswordCorrect(inputPassword) {
  const password = String(inputPassword ?? '')
  const correctPassword = String(ADMIN_PASSWORD)

  const passwordHash = crypto
    .createHash('sha256')
    .update(password)
    .digest()

  const correctPasswordHash = crypto
    .createHash('sha256')
    .update(correctPassword)
    .digest()

  return crypto.timingSafeEqual(passwordHash, correctPasswordHash)
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8'
  })

  res.end(JSON.stringify(data))
}

function sendExcel(res) {
  if (!fs.existsSync(fullPath)) {
    sendJson(res, 404, { error: 'Файл Excel ещё не создан' })
    return
  }

  res.writeHead(200, {
    'Content-Type':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="Users.xlsx"'
  })

  const fileStream = fs.createReadStream(fullPath)

  fileStream.pipe(res)

  fileStream.on('error', (error) => {
    console.error('Ошибка чтения Excel:', error)

    if (!res.headersSent) {
      sendJson(res, 500, { error: 'Не удалось скачать файл' })
      return
    }

    res.end()
  })
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    let isTooLarge = false

    req.on('data', (chunk) => {
      body += chunk.toString()

      if (body.length > 1_000_000) {
        isTooLarge = true
        req.destroy()
        reject(new Error('Слишком большой запрос'))
      }
    })

    req.on('end', () => {
      if (isTooLarge) {
        return
      }

      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error('Некорректный JSON'))
      }
    })

    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const route = url.pathname

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'POST' && route === '/check-password') {
    try {
      const data = await readJsonBody(req)

      if (!isPasswordCorrect(data.password)) {
        sendJson(res, 401, {
          success: false,
          message: 'Пароль не совпал'
        })
        return
      }

      sendExcel(res)
    } catch (error) {
      sendJson(res, 400, {
        error: error.message || 'Ошибка обработки запроса'
      })
    }
    return
  }

  if (req.method === 'POST' && route === '/api') {
    try {
      const data = await readJsonBody(req)

      const result = await appendToExcel(data)

      sendJson(res, 200, {
        message: result.message,
        created: result.created
      })
    } catch (error) {
      console.error('Ошибка обработки заявки:', error)

      sendJson(res, error.message === 'Некорректный JSON' ? 400 : 500, {
        error: 'Не удалось сохранить заявку'
      })
    }

    return
  }

  sendJson(res, 404, { error: 'Страница не найдена' })
})

server.listen(port, '0.0.0.0', () => {
  console.log('==== Сервер запущен ====')
  console.log(`==== Порт: ${port} ====`)
})