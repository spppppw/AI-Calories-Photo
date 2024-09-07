// Инициализация Firebase
var firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_FIREBASE_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_FIREBASE_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_FIREBASE_PROJECT_ID",
    storageBucket: "YOUR_FIREBASE_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID"
  };
  firebase.initializeApp(firebaseConfig);
  
  // Регистрация пользователя
  function register() {
    var name = document.getElementById("register-name").value;
    var email = document.getElementById("register-email").value;
    var password = document.getElementById("register-password").value;
  
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        var user = userCredential.user;
        return user.updateProfile({
          displayName: name
        });
      })
      .then(() => {
        alert("Регистрация прошла успешно!");
        showProfile();
      })
      .catch((error) => {
        alert("Ошибка регистрации: " + error.message);
      });
  }
  
  // Вход пользователя
  function login() {
    var email = document.getElementById("login-email").value;
    var password = document.getElementById("login-password").value;
  
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        alert("Вы вошли в систему!");
        showProfile();
      })
      .catch((error) => {
        alert("Ошибка входа: " + error.message);
      });
  }
  
  // Выход пользователя
  function logout() {
    firebase.auth().signOut().then(() => {
      alert("Вы вышли из системы.");
      document.getElementById("auth-section").classList.remove("hidden");
      document.getElementById("profile-section").classList.add("hidden");
    });
  }
  
  // Показать профиль пользователя
  function showProfile() {
    var user = firebase.auth().currentUser;
    if (user) {
      document.getElementById("auth-section").classList.add("hidden");
      document.getElementById("profile-section").classList.remove("hidden");
      document.getElementById("profile-name").innerText = "Имя: " + user.displayName;
      document.getElementById("profile-email").innerText = "Email: " + user.email;
      document.getElementById("profile-avatar").src = user.photoURL || "https://via.placeholder.com/100";
    }
  }
  
  // Переключение между формами входа и регистрации
  function toggleAuth() {
    document.getElementById("register-form").classList.toggle("hidden");
    document.getElementById("login-form").classList.toggle("hidden");
  }
  
  // Авторизация через Google
  function loginWithGoogle() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then((result) => {
        alert("Вы вошли через Google!");
        showProfile();
      })
      .catch((error) => {
        alert("Ошибка авторизации через Google: " + error.message);
      });
  }
  
  // Авторизация через Apple
  function loginWithApple() {
    var provider = new firebase.auth.OAuthProvider('apple.com');
    firebase.auth().signInWithPopup(provider)
      .then((result) => {
        alert("Вы вошли через Apple!");
        showProfile();
      })
      .catch((error) => {
        alert("Ошибка авторизации через Apple: " + error.message);
      });
  }
  
  // Загрузка и анализ фото еды
  function analyzeFood() {
    var fileInput = document.getElementById("food-photo");
    var file = fileInput.files[0];
  
    if (!file) {
      alert("Загрузите фото еды!");
      return;
    }
  
    var reader = new FileReader();
    reader.onloadend = function() {
      var base64Image = reader.result.split(',')[1];
  
      // Используем Clarifai API для анализа еды
      var apiKey = 'YOUR_CLARIFAI_API_KEY';
      fetch('https://api.clarifai.com/v2/models/food-item-recognition/outputs', {
        method: 'POST',
        headers: {
          'Authorization': 'Key ' + apiKey,
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
        fetchFatSecretData(foodName);
      })
      .catch(error => {
        console.error("Ошибка анализа изображения:", error);
        alert("Не удалось проанализировать изображение. Попробуйте ещё раз.");
      });
    };
  
    reader.readAsDataURL(file);
  }
  
  // Получение информации о калориях и КБЖУ через FatSecret API
  function fetchFatSecretData(foodName) {
    var apiKey = 'YOUR_FATSECRET_API_KEY';
    var apiSecret = 'YOUR_FATSECRET_API_SECRET';
  
    fetch('https://platform.fatsecret.com/rest/server.api?method=foods.search&format=json&search_expression=' + encodeURIComponent(foodName), {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + apiKey
      }
    })
    .then(response => response.json())
    .then(data => {
      var food = data.foods.food[0];
      var calories = food.food_description.match(/(\d+) ккал/)[1];
      document.getElementById("food-calories").innerText = "Калории: " + calories + " ккал";
      document.getElementById("food-nutrients").innerText = "Нутриенты: " + food.food_description;
      saveFoodToFirebase(foodName, calories);
    })
    .catch(error => {
      console.error("Ошибка получения данных о питании:", error);
      alert("Не удалось получить данные о питании. Попробуйте ещё раз.");
    });
  }
  
  // Сохранение данных о приёмах пищи в Firebase
  function saveFoodToFirebase(foodName, calories) {
    var user = firebase.auth().currentUser;
    if (!user) return;
  
    var foodData = {
      foodName: foodName,
      calories: calories,
      date: new Date().toISOString()
    };
  
    firebase.database().ref('users/' + user.uid + '/meals').push(foodData)
      .then(() => {
        alert("Данные о приёме пищи сохранены.");
      })
      .catch((error) => {
        console.error("Ошибка сохранения данных:", error);
        alert("Не удалось сохранить данные о приёме пищи. Попробуйте ещё раз.");
      });
  }