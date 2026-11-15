
class Send {
  constructor() {
    this.form = document.querySelector('form');
    this.itog = document.querySelector('.itog');
    this.bindEvent()
  }

  initFormData(event) {
    event.preventDefault()

    const { target } = event
    const formData = new FormData(target)
    const data = Object.fromEntries(formData.entries())
    console.log(data);
    this.sendBackend(data)
  }

  showHide(text) {
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
          const err = response.status
          this.showHide(`Ошибка: код ${response.status}`)
          throw new Error(err)
        }
        return response.json() //этот медот JSON.parse
      })
      .then((json) => {
        console.log('вот твой же объект тебе:', json);
        this.showHide('Данные отправлены!')
        return json
      })
      .catch((err) => {
        console.log(err);
      })
  }

  bindEvent() {
    this.form.addEventListener('submit', (event) => {
      this.initFormData(event)
    })
  }
}
new Send()