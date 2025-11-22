// Ждём, пока вся структура HTML-документа будет полностью загружена
document.addEventListener('DOMContentLoaded', function() {

    // Находим нашу кнопку на странице по её ID ('myButton')
    const button = document.getElementById('myButton');

    // Добавляем к кнопке "слушатель" события 'click'
    // Когда на кнопку кликают, выполняется функция, описанная внутри
    button.addEventListener('click', function() {
        // Создаём всплывающее окно (alert) с сообщением
        alert('и нах ты нажал??');

        // (Дополнительно) Меняем текст кнопки после нажатия
        button.textContent = 'Кнопка нажата!';
    });

});
