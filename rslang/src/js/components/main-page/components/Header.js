import {
  create,
  mainPageHeaderButtonConstants,
  mainPageUrls,
} from '../pathes';
import LogoutModalWindow from './LogoutModalWindow';

const {
  MAIN_PAGE_LOGO_URL,
} = mainPageUrls;

const {
  STATISTICS_BUTTON_TEXT,
  VOCABULARY_BUTTON_TEXT,
  PROMO_BUTTON_TEXT,
  ABOUT_TEAM_TEXT,
  STATISTICS_CODE,
  VOCABULARY_CODE,
  PROMO_CODE,
  ABOUT_TEAM_CODE,
  SETTINGS_CODE,
  LOG_OUT_BUTTON_TEXT,
} = mainPageHeaderButtonConstants;

class Header {
  constructor(userName) {
    this.HTML = null;
    this.userName = userName;
    this.modalWindow = new LogoutModalWindow();
  }

  render() {
    Header.activateBurgerMenuHandler();
    const settingsIconHTML = '<i class="fas fa-cog"></i>';
    this.HTML = create('header', 'main-page__header');
    document.body.append(this.renderBurgerMenuIcon());
    this.HTML.append(this.renderLogo());
    this.buttonsList = create('div', 'header__buttons-list', '', this.HTML);
    this.renderHeaderButton(VOCABULARY_BUTTON_TEXT, VOCABULARY_CODE);
    this.renderHeaderButton(STATISTICS_BUTTON_TEXT, STATISTICS_CODE);
    this.renderHeaderButton(PROMO_BUTTON_TEXT, PROMO_CODE);
    this.renderHeaderButton(ABOUT_TEAM_TEXT, ABOUT_TEAM_CODE);
    this.renderHeaderButton(settingsIconHTML, SETTINGS_CODE);
    this.HTML.append(this.renderUserBlock());

    return this.HTML;
  }

  renderLogo() {
    this.startPageLogoImage = create('img', 'main-page__image-logo', '', null, ['src', MAIN_PAGE_LOGO_URL]);
    return create('div', 'main-page__logo', this.startPageLogoImage);
  }

  renderUserBlock() {
    const container = create('div', 'header__user-block');
    const userIcon = create('i', 'fas fa-user header__user-icon');
    const userName = create('span', 'user-name__text', this.userName);
    create('div', 'header__user-name', [userIcon, userName], container);
    this.logoutButton = create('button', 'header__logout-button', LOG_OUT_BUTTON_TEXT, container);
    this.logoutButton.addEventListener('click', this.modalWindow.show.bind(this.modalWindow));

    return container;
  }

  renderHeaderButton(buttonText, buttonCode) {
    create('div', 'header__button', buttonText, this.buttonsList, ['pageCode', buttonCode]);
  }

  renderBurgerMenuIcon() {
    this.burgerMenuIcon = create('div', 'burger-menu-icon');
    create('div', 'burger-menu-icon__line', '', this.burgerMenuIcon);
    create('div', 'burger-menu-icon__line', '', this.burgerMenuIcon);
    create('div', 'burger-menu-icon__line', '', this.burgerMenuIcon);

    return this.burgerMenuIcon;
  }

  static activateBurgerMenuHandler() {
    document.addEventListener('click', (event) => {
      const target = event.target.closest('.burger-menu-icon');
      const overlayTarget = event.target.closest('.burger-menu-overlay');

      const burgetMenuIcon = document.querySelector('.burger-menu-icon')
      const burgerMenu = document.querySelector('.burger-menu');
      const burgerMenuOverlay = document.querySelector('.burger-menu-overlay');

      if (target) {
        target.classList.toggle('burger-icon__closed');
        burgerMenu.classList.toggle('burger-menu_opened');
        burgerMenuOverlay.classList.toggle('burger-menu-overlay_visible');
      }

      if (overlayTarget) {
        burgetMenuIcon.classList.remove('burger-icon__closed');
        burgerMenu.classList.remove('burger-menu_opened');
        burgerMenuOverlay.classList.remove('burger-menu-overlay_visible');
      }
    });
  }
}

export default Header;
