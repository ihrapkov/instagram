const stories = document.querySelector('.stories');
let currentIndex = 0;

function moveSlider() {
  const slideWidth = document.querySelector('.stories-item').offsetWidth + 10; // Ширина слайда + отступ
  currentIndex++;
  
  if (currentIndex >= document.querySelectorAll('.stories-item').length) {
    currentIndex = 0; // Возвращаемся к первому слайду
  }

  stories.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
}

// Запускаем автоматическое перемещение каждые 3 секунды
setInterval(moveSlider, 3000);