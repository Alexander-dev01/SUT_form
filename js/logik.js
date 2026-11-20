
class Send {
  constructor() {
    this.form = document.querySelector('form');
    this.itog = document.querySelector('.itog');
    this.reset = document.querySelector('[data-js-reset]');

    this.bindEvent()
  }

  downloadExcel() {
    fetch('http://localhost:5001/')
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.status)
        }
        return response.json()
      })
      .then((json) => {
        console.log('вот твой же download запрос:', json);
        return json
      })
      .catch((err) => {
        console.log(err);
        alert(`Ошибка - попробуйте снова (${err})`, true)
      })
  }

  resetId() {
    const hasID = JSON.parse(localStorage.getItem('id'))
    if (hasID) {
      localStorage.removeItem('id')
      alert('Id очищен, можно создавать новую заявку')

      return
    }
    alert('Не балуйтесь :)')
  }

  initFormData(event) {
    event.preventDefault()

    const { target } = event
    const formData = new FormData(target)
    const data = Object.fromEntries(formData.entries())
    let id = JSON.parse(localStorage.getItem('id'))
    if (!id) {
      id = Math.trunc(Math.random() * 1000000000)// crypto.randomUUID()
      localStorage.setItem('id', JSON.stringify(id))
    }
    data.id = id
    console.log(data);
    this.sendBackend(data)
  }

  showHide(text, err) {
    if (err) {
      this.itog.classList.add('itog-error');
    } else {
      this.itog.classList.remove('itog-error');
    }
    this.itog.textContent = text
    this.itog.classList.remove('invisible')
    setTimeout(() => {
      this.itog.classList.add('invisible')
    }, 3000);


  }

  sendBackend(data) {
    fetch('http://localhost:5001/', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.status)
        }
        return response.json()
      })
      .then((json) => {
        console.log('вот твой же объект тебе:', json);
        this.showHide(json.message)
        return json
      })
      .catch((err) => {
        console.log(err);
        this.showHide(`Ошибка - попробуйте снова (${err})`, true)
      })
  }

  bindEvent() {
    this.form.addEventListener('submit', (event) => {
      this.initFormData(event)
    })
    this.reset.addEventListener('click', () => {
      this.resetId()
    })
    this.reset.addEventListener('contextmenu', () => {
      this.downloadExcel()
    })
  }
}
new Send()


class Sekcii {
  constructor() {
    this.initialization()
    this.formAA()
    this.setPodsekcia()
    this.sekciaLogic()
    this.bindEvent()
  }

  initialization() {
    this.form = document.querySelector('form');
    this.sekcia = document.querySelector('[data-js-sekcia]')
    this.podsekcia = document.querySelector('[data-js-podsekcia]')
    this.foto = document.querySelector('[data-js-foto]')
    this.nazwanie = document.querySelector('[data-js-nazwanie]')
    this.kolwo = document.querySelector('[data-js-kolwo]')
  }

  formDataSekcia = null

  sostoyanie = {
    norm: () => {
      this.wikl(this.foto)
      this.wkl(this.nazwanie)
      this.wikl(this.kolwo)
    },
    foto: () => {
      this.wkl(this.foto)
      this.wkl(this.nazwanie)
      this.wikl(this.kolwo)
    },
    kolwo: () => {
      this.wikl(this.foto)
      this.wikl(this.nazwanie)
      this.wkl(this.kolwo)
    },
    nazwanie: () => {
      this.wikl(this.foto)
      this.wikl(this.nazwanie)
      this.wikl(this.kolwo)
    },
  }

  wkl(element) {
    element.style.display = 'flex'
    const input = element.querySelector('input')
    input.disabled = false
  }

  wikl(element) {
    element.style.display = 'none'
    const input = element.querySelector('input')
    input.disabled = true
  }

  podsekciaOptions = {
    'Программирование на пк': [
      'Scratch',
      'Другие языки программирования'
    ],

    'Физико-математические науки': [
      '4-7 классы',
      '8-11 классы и студенты до 18 лет'
    ],

    'Инженерно-техническая выставка': [
      'Рисунки «Мир науки и техники» (до 11 лет включительно) без личной защиты (прием заявок до определенного числа)',
      'Модели и макеты 1-4 классы (прием заявок до определенного числа)',
      'Модели и макеты 5-7 классы (прием заявок до определенного числа)',
      'Модели и макеты 8-11 классы и студенты до 18 лет (прием заявок до определенного числа)'
    ],

    'Робототехника': [
      'Лабиринт (прием заявок до определенного числа)',
      'Конкурс творческих проектов (прием заявок до определенного числа)',
      'Скоростная сборка (дать педагогу возможность прикреплять сразу список участников) (прием заявок до определенного числа)'
    ],

    'Атомная наука и техника': [
      'Инженерное мышление. Каракури',
      'Робототехника в различных областях применения энергии атома',
      '3D-моделирование и прототипирование'
    ],

    'Начальное техническое моделирование': [
      '1 классы',
      '2 классы',
      '3 классы',
      '4 классы',
      '5 классы'
    ],

    'Радиоконструирование': [
      '1-4 классы',
      '5-7 классы',
      '8-11 классы и до 18 лет'
    ],

    'Набор и верстка текста': [
      'Скоростной набор текста',
      'Верстка текста'
    ]
  };

  setPodsekcia() {
    this.podsekcia.options.length = 0;

    const sekciaElements = this.podsekciaOptions[this.formDataSekcia]
    // если в массиве нет секции с подсекцией тогда просто выходим с функции и делаем объект невидимым
    if (!sekciaElements) {
      this.podsekcia.style.display = 'none'
      return
    }
    this.podsekcia.style.display = 'block'

    sekciaElements.forEach(text => {
      const option = new Option(text, text);
      this.podsekcia.appendChild(option);
    });
  }


  sekciaLogic() {
    console.log(this.formDataSekcia);
    console.log(this.podsekcia.value);

    // работы ученика 3 поля ( фото, название и кол-во баллов )
    switch (this.formDataSekcia) {
      case 'Программирование на пк':
      case 'Web-программирование':
      case 'Физико-математические науки':
      case 'Робототехника':
      case 'Атомная наука и техника':
      case 'Современные компьютерные технологии':
      case 'География':
        if (this.podsekcia.value == 'Скоростная сборка (дать педагогу возможность прикреплять сразу список участников) (прием заявок до определенного числа)') {
          this.sostoyanie.nazwanie();
          console.log('название',);
        }
        else {
          this.sostoyanie.norm();
        }
        break;

      case 'Инженерно-техническая выставка':
        if (this.podsekcia.value == 'Рисунки «Мир науки и техники» (до 11 лет включительно) без личной защиты (прием заявок до определенного числа)') {
          this.sostoyanie.foto();
          console.log('foto',);

        }
        else {
          this.sostoyanie.norm();
        }
        break;

      case 'Эрудит':
      case 'Мир вокруг нас':
      case 'Радиоконструирование':
      case 'Набор и верстка текста':
        this.sostoyanie.nazwanie();
        break;

      case 'Начальное техническое моделирование':
        this.sostoyanie.kolwo();
        break;

      default:
        this.sostoyanie.norm();
        break;
    }
  }

  formAA() {
    const formData = new FormData(this.form)
    const data = Object.fromEntries(formData.entries())
    this.formDataSekcia = data.sekcia
  }

  bindEvent() {
    this.sekcia.addEventListener('change', () => {
      this.formAA()
      this.setPodsekcia()
      this.sekciaLogic()
    })
    this.podsekcia.addEventListener('change', () => {
      this.formAA()
      this.sekciaLogic()
    })
  }
}
new Sekcii()