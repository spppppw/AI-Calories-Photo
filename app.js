// Firebase инициализация
var firebaseConfig = {
    apiKey: "AIzaSyARs75h_J3m8WU73vggq4xn_c1c6IFYStk",
    authDomain: "ai-calories-photo.firebaseapp.com",
    projectId: "ai-calories-photo",
    storageBucket: "ai-calories-photo.appspot.com",
    messagingSenderId: "765560200799",
    appId: "1:765560200799:web:008f2d2724d3c8f81305ea",
    measurementId: "G-6T1GYKQ7QT"
  };
  firebase.initializeApp(firebaseConfig);
  
  // Функция регистрации
  function register() {
    var name = document.getElementById("name-register").value;
    var email = document.getElementById("email-register").value;
    var password = document.getElementById("password-register").value;
  
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        var user = userCredential.user;
        return user.updateProfile({
          displayName: name
        });
      })
      .then(() => {
        alert("Регистрация прошла успешно!");
        window.location.href = 'dashboard.html'; // Переход в ЛК
      })
      .catch((error) => {
        alert("Ошибка регистрации: " + error.message);
      });
  }
  
  // Функция входа
  function login() {
    var email = document.getElementById("email-login").value;
    var password = document.getElementById("password-login").value;
  
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        alert("Вы успешно вошли в систему!");
        window.location.href = 'dashboard.html'; // Переход в ЛК
      })
      .catch((error) => {
        alert("Ошибка входа: " + error.message);
      });
  }
  
  // Выход из системы
  function logout() {
    firebase.auth().signOut().then(() => {
      alert("Вы вышли из системы.");
      window.location.href = 'index.html'; // Возврат на страницу входа
    });
  }
  
  // Отображение профиля в ЛК
  function displayProfile() {
    var user = firebase.auth().currentUser;
    if (user) {
      document.getElementById("profile-name").innerText = user.displayName;
      document.getElementById("profile-email").innerText = user.email;
      document.getElementById("profile-avatar").src = user.photoURL || 'img/avatar.png'; // Placeholder если нет фото
    }
  }
  
  // Загрузка фото еды и анализ через Clarifai API
  function analyzeFood() {
    var fileInput = document.getElementById("food-photo");
    var file = fileInput.files[0];
  
    if (!file) {
      alert("Пожалуйста, загрузите фото еды!");
      return;
    }
  
    var reader = new FileReader();
    reader.onloadend = function () {
      var base64Image = reader.result.split(',')[1];
  
      // Отправка изображения в Clarifai API
      fetch('https://api.clarifai.com/v2/models/food-item-recognition/outputs', {
        method: 'POST',
        headers: {
          'Authorization': 'Key 10a38d2f1c934f129544e30dfd1a24b8', // Твой Clarifai ключ
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: [
            {
              data: {
                image: {
                  base64: base64Image
                }
              }
            }
          ]
        })
      })
      .then(response => response.json())
      .then(data => {
        var foodName = data.outputs[0].data.concepts[0].name;
        document.getElementById("food-name").innerText = "Еда: " + foodName;
  
        // Получение данных о калориях через FatSecret API
        fetchFatSecretData(foodName);
      })
      .catch(error => {
        console.error("Ошибка анализа изображения:", error);
        alert("Не удалось проанализировать изображение.");
      });
    };
    reader.readAsDataURL(file);
  }
  
  // Функция получения токена доступа FatSecret
  function getFatSecretToken() {
    return fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('98526599c876406ea4164afbe448d4fa:006f2301cdf3472a89ec1359f26e243e'), // Замените на твои Client ID и Client Secret
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=basic'
    })
    .then(response => response.json())
    .then(data => {
      return data.access_token;
    })
    .catch(error => {
      console.error("Ошибка получения токена FatSecret:", error);
    });
  }
  
  // Функция запроса данных о еде через FatSecret API
  function fetchFatSecretData(foodName) {
    getFatSecretToken().then(token => {
      fetch('https://platform.fatsecret.com/rest/server.api?method=foods.search&format=json&search_expression=' + encodeURIComponent(foodName), {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.foods && data.foods.food.length > 0) {
          var food = data.foods.food[0];
          var calories = food.food_description.match(/(\d+) ккал/)[1];
          document.getElementById("food-calories").innerText = "Калории: " + calories + " ккал";
          document.getElementById("food-nutrients").innerText = "Нутриенты: " + food.food_description;
        } else {
          alert("Не удалось найти информацию о продукте.");
        }
      })
      .catch(error => {
        console.error("Ошибка получения данных о калориях:", error);
      });
    });
  }
  
  // Обработка ошибок (например, если пользователь не вошел)
  firebase.auth().onAuthStateChanged(function (user) {
    if (!user && window.location.pathname !== '/index.html') {
      window.location.href = 'index.html'; // Редирект на страницу входа
    } else {
      displayProfile(); // Если пользователь авторизован, отображаем профиль
    }
  });