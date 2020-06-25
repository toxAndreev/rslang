import {
  createUserWord,
  updateUserWord,
  getAllUserWords,
  getAggregatedWordsByFilter,
  updateStatistics,
  getStatistics,
} from '../../service/service';
import create from '../../utils/сreate';
import {
  urls,
  mainGameConstants,
  wordsToLearnOptions,
  estimateButtonsTypes,
  vocabularyConstants,
} from '../../constants/constants';
import {
  checkIsManyMistakes,
  addDaysToTheDate,
  calculatePercentage,
} from '../../utils/calculations';

import WordCard from './components/word-card/WordCard';
import SettingsControls from './components/settings-controls/SettingsControls';
import EstimateButtonsBlock from './components/estimate-buttons/EstimateButtonsBlock';
import WordsSelectList from './components/words-select-list/WordsSelectList';
import ProgressBar from './components/progress-bar/ProgressBar';
import Preloader from '../preloader/Preloader';
import FormControll from './components/form-control/FormControl';
import Authentication from '../authentication/Authentication';
import DailyStatistics from './components/daily-statistics/DailyStatistics';

const {
  REMOVE_WORD_BUTTON,
  ADD_TO_DIFFICULT_WORDS,
  EMPTY_WORD_LIST,
  DAILY_NORM_IS_COMPLETED,
} = mainGameConstants;

const {
  MIXED,
  ONLY_NEW_WORDS,
  ONLY_WORDS_TO_REPEAT,
  ONLY_DIFFICULT_WORDS,
} = wordsToLearnOptions;

const {
  AGAIN, HARD, GOOD, EASY,
} = estimateButtonsTypes;

const {
  WORDS_AUDIOS_URL,
} = urls;

const {
  LEARNED_WORDS_TITLE,
  WORDS_TO_LEARN_TITLE,
  REMOVED_WORDS_TITLE,
  DIFFUCULT_WORDS_TITLE,
  NEW_WORDS_TITLE,
} = vocabularyConstants;

class MainGame {
  constructor(userState) {
    this.state = {
      currentWordIndex: 0,
      mistakesInCurrentWord: 0,
      allNumberOfMistakes: 0,
      learnedWordsToday: 0,
      longestSeriesOfAnswers: 0,
      longestSeriesIndicator: 0,
      correctAnswersNumber: 0,
      isNormCompleted: false,
      lastGameWinDate: null,
      userWords: [],
      wordsToLearn: [],
      wordsArray: [],
      newWords: [],
      audio: new Audio(),
      audios: [],
      isAudioEnded: true,
      gameSetting: {
        isAudioPlaybackEnabled: true,
        isTranslationsEnabled: true,
      },
      userState,
      settings: {
        newWordsPerDay: 3,
        wordsPerDay: 3,
      },
    };
  }

  async render(elementQuery) {
    const { currentWordIndex } = this.state;

    const mainGameHTML = create('div', 'main-game');
    document.querySelector(elementQuery).append(mainGameHTML);
    this.preloader = new Preloader();

    try {
      this.preloader.render();
      this.preloader.show();

      await this.resetStatisticsIfNewDay();
      await this.getStatisticsData();
      this.state.userWords = await this.getAllUserWordsFromBackend();
      this.state.userWords = this.parseUserWordsData();

      if (!this.state.isNormCompleted) {
        await this.setNewWords();
        this.state.wordsToLearn = await this.selectWordsToLearn();
        this.wordsDataLength = this.state.wordsToLearn.length;
        this.setAudiosForWords(this.state.wordsToLearn[currentWordIndex]);

        const currentWord = this.state.wordsToLearn[currentWordIndex].word;
        const wordCard = MainGame.createWordCard(this.state.wordsToLearn[currentWordIndex]);
        const mainGameControls = MainGame.renderMainGameControls();
        this.formControl = new FormControll(currentWord);
        this.progressBar = new ProgressBar(currentWordIndex, this.state.wordsToLearn.length);
        const mainGameMainContainer = create(
          'div', 'main-game__main-container', [wordCard.render(), this.formControl.render()],
        );

        mainGameHTML.append(
          mainGameControls,
          mainGameMainContainer,
          this.progressBar.render(),
        );

        const { learnedWordsToday } = this.state;
        const { wordsPerDay } = this.state.settings;
        this.progressBar.updateSize(learnedWordsToday, wordsPerDay);
        const wordCardInput = document.querySelector('.word-card__input');
        wordCardInput.focus();
        this.activateAllInteractiveElements();
        this.preloader.hide();
      } else {
        const { learnedWordsToday } = this.state;
        console.log('learnedWordsToday', learnedWordsToday)
        const { wordsPerDay } = this.state.settings;
        const mainGameMainContainer = create('div', 'main-game__main-container');
        const mainGameControls = MainGame.renderMainGameControls();
        this.progressBar = new ProgressBar(learnedWordsToday, wordsPerDay);
        const message = MainGame.showMessage(DAILY_NORM_IS_COMPLETED);
        mainGameMainContainer.append(message)
        mainGameHTML.append(
          mainGameControls,
          mainGameMainContainer,
          this.progressBar.render(),
        );
        MainGame.toggleVocabularyButtons(false);
      }
    } catch (error) {
      Authentication.createErrorBlock(error.message);
      this.preloader.hide();
    }
  }

  activateAllInteractiveElements() {
    this.activateGameSettingsEvents();
    this.activateNextButton();
    this.activateShowAnswerButton();
    MainGame.activateInputWordsHandler();
    this.activateVocabularyButtons();
    this.activateWordsToLearnSelect();
    this.activateEstimateButtons();
    MainGame.toggleVocabularyButtons(false);
  }

  parseUserWordsData() {
    return this.state.userWords.map((item) => ({
      ...item,
      optional: {
        ...item.optional,
        valuationDate: new Date(item.optional.valuationDate),
        daysInterval: parseInt(item.optional.daysInterval, 10),
        allData: JSON.parse(item.optional.allData),
      },
    }));
  }

  getWordsToRevise() {
    const currentTime = new Date();
    const { userWords } = this.state;
    const wordsToRevise = userWords.filter((word) => {
      const { valuationDate, daysInterval } = word.optional;
      const elapsedTime = addDaysToTheDate(daysInterval);
      const isNeedToRevise = elapsedTime < currentTime;
      return isNeedToRevise && valuationDate && daysInterval;
    });

    return wordsToRevise;
  }

  async getStatisticsData() {
    try {
      const { userId, token } = this.getUserDataForAuthorization();
      const statistics = await getStatistics(userId, token);
      console.log('statistics', statistics);
      const {
        learnedWordsToday,
        correctAnswersNumber,
        isNormCompleted,
      } = JSON.parse(statistics.optional.mainGame);
      this.state.learnedWordsToday = parseInt(learnedWordsToday, 10);
      this.state.correctAnswersNumber = parseInt(correctAnswersNumber, 10);
      this.state.isNormCompleted = JSON.parse(isNormCompleted);
    } catch (error) {
      this.state.correctAnswersNumber = 0;
    }
  }

  async setStatisticsData() {
    const { userId, token } = this.getUserDataForAuthorization();
    const mainGame = JSON.stringify({
      learnedWordsToday: this.state.learnedWordsToday,
      correctAnswersNumber: this.state.correctAnswersNumber,
      lastGameWinDate: this.state.lastGameWinDate,
      isNormCompleted: this.state.isNormCompleted,
    });
    const body = {
      learnedWords: 0,
      optional: {
        mainGame,
      },
    };
    await updateStatistics(userId, token, body);
  }

  async resetStatisticsIfNewDay() {
    const { userId, token } = this.getUserDataForAuthorization();
    const statistics = await getStatistics(userId, token);
    console.log(statistics);
    const data = JSON.parse(statistics.optional.mainGame);
    let date = new Date(data.lastGameWinDate).setHours(0, 0, 0);

    const currentDate = new Date();
    date = addDaysToTheDate(1, new Date(date));
    console.log('date', date);

    if (currentDate > date) {
      console.log('TRUE');
      this.state.isNormCompleted = true;
      this.state.lastGameWinDate = null;
      this.state.correctAnswersNumber = 0;
      this.state.learnedWordsToday = 0;

      await this.setStatisticsData();
    }
  }

  async setNewWords() {
    const { userId, token } = this.getUserDataForAuthorization();
    const { newWordsPerDay } = this.state.settings;
    const { learnedWordsToday } = this.state;
    const newWords = await getAggregatedWordsByFilter(userId, token, newWordsPerDay);
    console.log(newWords);
    this.state.newWords = newWords[0].paginatedResults.slice(0, newWordsPerDay - learnedWordsToday);
    console.log('this.state.newWords', this.state.newWords);
  }

  async selectWordsToLearn() {
    const wordsToRevise = this.getWordsToRevise();
    const { wordsPerDay, newWordsPerDay } = this.state.settings;
    const wordsToReviseLength = wordsPerDay - newWordsPerDay;

    return [...this.state.newWords, ...wordsToRevise.slice(0, wordsToReviseLength)];
  }

  async getAllUserWordsFromBackend() {
    const { userId, token } = this.getUserDataForAuthorization();
    const data = await getAllUserWords(userId, token);
    console.log(data);
    return data;
  }

  selectUserWordsByType(wordsType) {
    return this.state.userWords
      .filter((word) => word.optional.vocabulary === wordsType)
      .map((word) => (word.optional ? word.optional.allData : word));
  }

  getUserDataForAuthorization() {
    const savedUserData = localStorage.getItem('user-data');
    if (savedUserData) {
      return JSON.parse(savedUserData);
    }

    return {
      userId: this.userState.id,
      token: this.userState.token,
    };
  }

  static renderMainGameControls() {
    const container = create('div', 'main-game__controls');
    const gameSettingsBlock = new SettingsControls();
    const vocabularyButtons = MainGame.renderVocabularyButtons();
    const wordsSelectList = new WordsSelectList();
    container.append(
      gameSettingsBlock.render(),
      vocabularyButtons,
      wordsSelectList.render(),
    );

    return container;
  }

  renderDailyStatistics() {
    const { wordsPerDay } = this.state.settings;
    const { newWords, longestSeriesOfAnswers, correctAnswersNumber } = this.state;
    console.log(correctAnswersNumber);
    const percentOfCorrectAnswers = calculatePercentage(correctAnswersNumber, wordsPerDay);
    const dailyStatistics = new DailyStatistics(
      wordsPerDay, percentOfCorrectAnswers, newWords.length, longestSeriesOfAnswers,
    );

    return dailyStatistics.render();
  }

  renderWordCard(currentWordCard) {
    const wordCard = MainGame.createWordCard(currentWordCard);
    this.setAudiosForWords(currentWordCard);
    document.querySelector('.main-game__main-container').prepend(wordCard.render());

    const wordCardInput = document.querySelector('.word-card__input');
    wordCardInput.focus();
    this.formControl.updateInputWidth(currentWordCard.word);
    this.toggleWordCardTranslation();
  }

  static renderVocabularyButtons() {
    const removeWordButton = FormControll.renderButton('remove-word', REMOVE_WORD_BUTTON);
    const addToDifficultButton = FormControll.renderButton('add-to-difficult', ADD_TO_DIFFICULT_WORDS);
    const container = create('div', 'word-card__vocabulary-buttons', [removeWordButton, addToDifficultButton]);

    return container;
  }

  activateWordsToLearnSelect() {
    const selectHTML = document.querySelector('.main-game__words-type-select');
    selectHTML.addEventListener('change', async (event) => {
      const { options } = event.target;
      const selectedOptionValue = options[options.selectedIndex].value;
      let selectedArrayType = [];
      switch (selectedOptionValue) {
        case MIXED:
        default:
          selectedArrayType = await this.selectWordsToLearn();
          break;
        case ONLY_NEW_WORDS: {
          const wordsToLearnTexts = this.state.userWords
            .map((word) => word.word || word.optional.word);
          selectedArrayType = this.state.newWords
            .filter((word) => !wordsToLearnTexts.includes(word.word));
          // this.state.newWords = selectedArrayType;
          break;
        }
        case ONLY_WORDS_TO_REPEAT: {
          const wordsToLearnTexts = this.state.userWords
            .map((word) => word.word || word.optional.word);
          selectedArrayType = this.getWordsToRevise()
            .filter((word) => !wordsToLearnTexts.includes(word.optional.word));
          break;
        }
        case ONLY_DIFFICULT_WORDS:
          selectedArrayType = this.selectUserWordsByType(DIFFUCULT_WORDS_TITLE);
          break;
      }

      console.log('selectedArrayType', selectedArrayType);
      const { wordsPerDay } = this.state.settings;
      this.state.currentWordIndex = -1;
      this.state.wordsToLearn = selectedArrayType;
      this.renderNextWordCard();
      const { wordsToLearn, learnedWordsToday } = this.state;
      this.progressBar.updateSize(learnedWordsToday, wordsToLearn.length);
      console.log('wordsToLearn', wordsToLearn);
    });
  }

  activateGameSettingsEvents() {
    const autoplaybackSettingCheckbox = document.querySelector('.main-game__autoplayback');
    const translationSettingCheckbox = document.querySelector('.main-game__translations');

    autoplaybackSettingCheckbox.addEventListener('change', (event) => {
      this.state.gameSetting.isAudioPlaybackEnabled = event.target.checked;
    });

    translationSettingCheckbox.addEventListener('change', (event) => {
      this.state.gameSetting.isTranslationsEnabled = event.target.checked;
      this.toggleWordCardTranslation();
    });
  }

  toggleWordCardTranslation() {
    const wordTransaltionHTML = document.querySelector('.word-card__translation');
    if (this.state.gameSetting.isTranslationsEnabled) {
      wordTransaltionHTML.classList.remove('word-card__translation_hidden');
    } else {
      wordTransaltionHTML.classList.add('word-card__translation_hidden');
    }
  }

  switchToTheNextWordCard(isForShowAnswerButton = false) {
    const inputHTML = document.querySelector('.word-card__input');
    const sentencesWords = document.querySelectorAll('.word-card__sentence-word');
    const userAnswerHTML = document.querySelector('.word-card__user-answer');
    const mainContainer = document.querySelector('.main-game__main-container');

    const { currentWordIndex, wordsToLearn } = this.state;
    console.log('words', wordsToLearn);
    console.log('words2', this.state.wordsToLearn);
    const { isAudioPlaybackEnabled, isTranslationsEnabled } = this.state.gameSetting;

    if (currentWordIndex !== wordsToLearn.length) {
      console.log(wordsToLearn[currentWordIndex]);
      console.log('currentWordIndex', currentWordIndex);
      const trimedValue = inputHTML.value.trim().toLowerCase();
      const numberOfMistakes = MainGame.checkWord(wordsToLearn[currentWordIndex].word);

      if (isAudioPlaybackEnabled && this.state.isAudioEnded) {
        this.playAudiosInTurns(0);
      }
      if (isTranslationsEnabled) {
        MainGame.toggleTranslations();
      }

      if ((numberOfMistakes === 0 && trimedValue.length) || isForShowAnswerButton) {
        const { mistakesInCurrentWord } = this.state;
        sentencesWords.forEach((word) => {
          word.classList.add('word-card__sentence-word_visible');
        });
        inputHTML.value = '';
        userAnswerHTML.classList.remove('word-card__user-answer_translucent');
        MainGame.toggleControlElements();
        MainGame.toggleVocabularyButtons();

        if (mistakesInCurrentWord > 0) {
          this.addWordToTheCurrentTraining();
        } else {
          this.state.longestSeriesIndicator = 0;
          if (this.state.longestSeriesIndicator === 0) {
            this.state.longestSeriesOfAnswers += 1;
          }
          this.state.learnedWordsToday += 1;
          const { wordsPerDay } = this.state.settings;
          const { learnedWordsToday } = this.state;
          this.progressBar.updateSize(learnedWordsToday, wordsPerDay);
        }
        this.estimateWords = new EstimateButtonsBlock();
        mainContainer.append(this.estimateWords.render());
        this.state.correctAnswersNumber += 1;
      } else {
        this.state.mistakesInCurrentWord += 1;
        this.state.allNumberOfMistakes += 1;
        this.state.longestSeriesIndicator += 1;
        inputHTML.value = '';
        setTimeout(() => {
          userAnswerHTML.classList.add('word-card__user-answer_translucent');
        }, 1000);
      }
    }
  }

  static toggleControlElements(isToDisable = true) {
    const inputHTML = document.querySelector('.word-card__input');
    const nextButtonHTML = document.querySelector('.main-game__next-button');
    const showAnswerButton = document.querySelector('.main-game__show-answer-button');

    if (isToDisable) {
      inputHTML.setAttribute('disabled', 'disabled');
      nextButtonHTML.setAttribute('disabled', 'disabled');
      showAnswerButton.setAttribute('disabled', 'disabled');
    } else {
      inputHTML.removeAttribute('disabled', 'disabled');
      nextButtonHTML.removeAttribute('disabled', 'disabled');
      showAnswerButton.removeAttribute('disabled', 'disabled');
    }
  }

  addWordToTheCurrentTraining() {
    const { wordsToLearn, currentWordIndex } = this.state;
    const { wordsPerDay } = this.state.settings;
    const { learnedWordsToday } = this.state;

    const currentWord = wordsToLearn[currentWordIndex];
    this.state.wordsToLearn.push(currentWord);
    this.progressBar.updateSize(learnedWordsToday, wordsPerDay);
  }

  static async createWordDataForBackend(
    currentWord, estimation, isOnlyObject = false, vocabulary = WORDS_TO_LEARN_TITLE,
  ) {
    const wordData = {
      id: currentWord.id || currentWord._id,
      word: currentWord.word,
      difficulty: estimation.text || GOOD.text,
      vocabulary: vocabulary || WORDS_TO_LEARN_TITLE,
      daysInterval: estimation.daysInterval,
      valuationDate: new Date(),
      allData: currentWord,
    };
    const savedUserData = JSON.parse(localStorage.getItem('user-data'));
    const { userId, token } = savedUserData;
    const {
      id: wordId, word, difficulty, daysInterval, valuationDate, allData,
    } = wordData;
    const dataToRecieve = {
      difficulty,
      optional: {
        word,
        daysInterval,
        vocabulary,
        valuationDate: valuationDate.toString(),
        allData: JSON.stringify(allData),
      },
    };

    if (isOnlyObject) {
      console.log(dataToRecieve);
      return dataToRecieve;
    }
    console.log(userId);
    console.log(wordId);
    const data = await createUserWord(userId, wordId, dataToRecieve, token);
    return data;
  }

  activateEstimateButtons() {
    document.addEventListener('click', async (event) => {
      if (event.target.classList.contains('main-game__estimate-button')) {
        if (this.state.currentWordIndex === this.state.wordsToLearn.length - 1) {
          const statistics = this.renderDailyStatistics();
          document.body.append(statistics);
          this.state.isNormCompleted = true;
          this.state.learnedWordsToday = 0;
          this.state.correctAnswersNumber = 0;
          this.state.lastGameWinDate = new Date();
        }
        if (this.state.currentWordIndex !== this.state.wordsToLearn.length - 1) {
          const targetElementAppraisal = event.target.dataset.buttonAprraisal;

          switch (targetElementAppraisal) {
            case AGAIN.text: {
              const { learnedWordsToday, mistakesInCurrentWord } = this.state;
              if (mistakesInCurrentWord === 0) {
                this.state.learnedWordsToday = (learnedWordsToday - 1 < 0) ? 0 : learnedWordsToday - 1;
              }
              this.addWordToTheCurrentTraining();
              this.state.mistakesInCurrentWord = 0;
              break;
            }
            case HARD.text: {
              await this.addWordToTheVocabulary(LEARNED_WORDS_TITLE, HARD);
              break;
            }
            case GOOD.text: {
              await this.addWordToTheVocabulary(LEARNED_WORDS_TITLE, GOOD);
              break;
            }
            case EASY.text: {
              await this.addWordToTheVocabulary(LEARNED_WORDS_TITLE, EASY);
              break;
            }
            default:
              return;
          }

          this.renderNextWordCard();
        }

        await this.setStatisticsData();
      }
    });
  }

  static showMessage(message = EMPTY_WORD_LIST) {
    const mainGameMessage = document.querySelector('.main-game__message');
    if (mainGameMessage) {
      mainGameMessage.remove();
    }

    return create('div', 'main-game__message', message);
  }

  renderNextWordCard() {
    const userAnswerHTML = document.querySelector('.word-card__user-answer');
    const inputHTML = document.querySelector('.word-card__input');
    const { wordsToLearn } = this.state;
    MainGame.removeWordCardFromDOM();
    if (this.estimateWords) {
      this.estimateWords.removeFromDOM();
    }
    this.state.audio.pause();
    this.state.isAudioEnded = true;
    MainGame.toggleControlElements(false);
    MainGame.toggleVocabularyButtons(false);
    userAnswerHTML.innerHTML = '';
    userAnswerHTML.classList.remove('word-card__user-answer_translucent');

    if (!wordsToLearn.length) {
      const mainContainer = document.querySelector('.main-game__main-container');
      mainContainer.append(MainGame.showMessage());
      this.progressBar.hide();
      this.formControl.hide();
    } else {
      this.state.currentWordIndex += 1;
      this.progressBar.show();
      this.formControl.show();
      this.renderWordCard(wordsToLearn[this.state.currentWordIndex]);
      inputHTML.focus();
    }
  }

  activateNextButton() {
    const form = document.querySelector('.main-game__form');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.switchToTheNextWordCard();
    });
  }

  activateShowAnswerButton() {
    const showAnswerButton = document.querySelector('.main-game__show-answer-button');

    showAnswerButton.addEventListener('click', () => {
      this.switchToTheNextWordCard(true);
    });
  }

  static toggleVocabularyButtons(isToShow = true) {
    const removeWordButton = document.querySelector('.main-game__remove-word');
    const addToDifficultsButton = document.querySelector('.main-game__add-to-difficult');

    if (isToShow) {
      removeWordButton.removeAttribute('disabled');
      addToDifficultsButton.removeAttribute('disabled');
    } else {
      removeWordButton.setAttribute('disabled', 'disabled');
      addToDifficultsButton.setAttribute('disabled', 'disabled');
    }
  }

  activateVocabularyButtons() {
    document.addEventListener('click', async (event) => {
      if (event.target.classList.contains('main-game__remove-word')) {
        const buttonType = this.getButtonTypeOfCurrentWord();
        await this.addWordToTheVocabulary(REMOVED_WORDS_TITLE, buttonType);
        this.renderNextWordCard();
      }

      if (event.target.classList.contains('main-game__add-to-difficult')) {
        const buttonType = this.getButtonTypeOfCurrentWord();
        await this.addWordToTheVocabulary(DIFFUCULT_WORDS_TITLE, buttonType);
        this.renderNextWordCard();
      }
    });
  }

  getButtonTypeOfCurrentWord() {
    const currentWord = this.state.wordsToLearn[this.state.currentWordIndex];
    const wordFromBackend = this.state.userWords.length
      && this.state.userWords.find((word) => word.wordId === currentWord.id);
    return wordFromBackend && wordFromBackend.difficulty;
  }

  async addWordToTheVocabulary(vocabularyType = WORDS_TO_LEARN_TITLE, buttonType = GOOD.text, wordToAdd) {
    const currentWord = wordToAdd || this.state.wordsToLearn[this.state.currentWordIndex];
    const userWordObject = this.state.userWords.find((word) => word.wordId === currentWord.id);
    const { userId, token } = this.getUserDataForAuthorization();

    if (userWordObject) {
      console.log('for update');
      const data = await MainGame.createWordDataForBackend(currentWord, buttonType, true, vocabularyType);
      console.log(data);
      await updateUserWord(userId, currentWord.id, data, token);
    } else {
      console.log('for create');
      await MainGame.createWordDataForBackend(currentWord, buttonType, false, vocabularyType);
    }
    this.state.userWords = await this.getAllUserWordsFromBackend();
    this.state.mistakesInCurrentWord = 0;
    console.log('this.state.userWords', this.state.userWords);
  }

  static checkWord(word) {
    const correctLetters = word.toLowerCase().split('');
    const inputHTML = document.querySelector('.word-card__input');
    const userAnswerHTML = document.querySelector('.word-card__user-answer');
    const inputValueLetters = inputHTML.value.trim().toLowerCase().split('');

    userAnswerHTML.innerHTML = '';
    let numberOfMistakes = inputValueLetters
      .filter((letter, index) => letter !== correctLetters[index]).length;
    if (inputValueLetters.length < correctLetters.length) {
      const blankLettersNumber = correctLetters.length - inputValueLetters.length;
      numberOfMistakes += blankLettersNumber;
    }
    const isManyMistakes = checkIsManyMistakes(correctLetters.length, numberOfMistakes);

    correctLetters.forEach((letter, index) => {
      const isLetterCorrect = letter === inputValueLetters[index];
      let extraClassName = null;
      switch (true) {
        case isLetterCorrect:
          extraClassName = 'word-card-letter_correct';
          break;
        case !inputValueLetters.length:
          extraClassName = 'word-card-letter_many-mistakes';
          break;
        case !isLetterCorrect && !isManyMistakes:
        default:
          extraClassName = 'word-card-letter_not-many-mistakes';
          break;
        case !isLetterCorrect && isManyMistakes:
          extraClassName = 'word-card-letter_many-mistakes';
          break;
      }

      const letterHTML = create('span', `word-card-letter ${extraClassName}`, letter);
      userAnswerHTML.append(letterHTML);
    });

    if (numberOfMistakes === 0 && inputValueLetters.length) return 0;

    return numberOfMistakes;
  }

  static activateInputWordsHandler() {
    const formHTML = document.querySelector('.main-game__form');
    const inputHTML = document.querySelector('.word-card__input');
    const userAnswerHTML = document.querySelector('.word-card__user-answer');

    formHTML.addEventListener('click', (event) => {
      if (event.target.closest('.word-card__user-answer')) {
        inputHTML.focus();
      }
    });

    inputHTML.addEventListener('input', () => {
      if (userAnswerHTML && userAnswerHTML.childElementCount > 0) {
        userAnswerHTML.innerHTML = '';
        userAnswerHTML.classList.remove('word-card__user-answer_translucent');
      }
    });
  }

  static toggleTranslations(isToShow = true) {
    const translationElements = document.querySelectorAll('[data-translation-element]');

    translationElements.forEach((element) => {
      if (isToShow) {
        element.classList.remove('hidden-translation');
      } else {
        element.classList.add('hidden-translation');
      }
    });
  }

  playAudiosInTurns(number) {
    if (number < this.state.audios.length) {
      this.state.isAudioEnded = false;
      let firstAudioIndex = number;
      this.playAudio(this.state.audios[firstAudioIndex]);

      this.state.audio.onended = () => {
        if (firstAudioIndex === this.state.audios.length - 1) {
          this.state.isAudioEnded = true;
        }

        firstAudioIndex += 1;
        this.playAudiosInTurns(firstAudioIndex);
      };
    }
  }

  playAudio(source) {
    const { src, ended } = this.state.audio;

    if (src === '' || src !== source || ended) {
      this.state.audio.src = source;
      this.state.audio.play();
    }
  }

  static createWordCard(currentWord) {
    const wordCard = new WordCard(
      currentWord.id,
      currentWord.word,
      currentWord.wordTranslate,
      currentWord.textMeaning,
      currentWord.textMeaningTranslate,
      currentWord.textExample,
      currentWord.textExampleTranslate,
      currentWord.audio,
      currentWord.image,
    );

    return wordCard;
  }

  static removeWordCardFromDOM() {
    const wordCardHTML = document.querySelector('.main-game__word-card');
    if (wordCardHTML) {
      wordCardHTML.remove();
    }
  }

  setAudiosForWords(currentWord) {
    this.state.audios = [
      `${WORDS_AUDIOS_URL}${currentWord.audio}`,
      `${WORDS_AUDIOS_URL}${currentWord.audioMeaning}`,
      `${WORDS_AUDIOS_URL}${currentWord.audioExample}`,
    ];
  }
}

export default MainGame;
