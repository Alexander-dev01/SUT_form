
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
        this.showHide('Данные сохранены!')
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
  }
}
new Send()