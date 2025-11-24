class FooterComponent extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="footer">
        <div class="footer-buttons">
          <button class="secondary-text-lg" onclick="window.open('https://t.me/Khachatur1', '_blank')"><p>Написать мне</p></button>
          <button class="secondary-text-lg" onclick="window.open('https://pay.cloudtips.ru/p/3cd13ee0', '_blank')"><p>Поддержать проект</p></button>
        </div>
        <div class="footer-text">
          <p class="h2 wishes">С любовью от Хачатура 🤍</p>
          <p class="md-italic copyright">
            Все права защищены на совесть · 2024-2025<br>
            Библиотечка. Твой компас в мире дизайна. Версия 5.0
          </p>
        </div>
      </div>
    `;
  }
}
customElements.define('footer-component', FooterComponent);
