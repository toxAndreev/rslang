import create from '../../../utils/сreate';
import { getWords, getAudio } from '../../../service/service';
import { urls, sprint, vocabularyConstants, wordsToLearnSelectConstants,
StatisticsGameCodes } from '../../../constants/constants';
import Preloader from '../../preloader/preloader';
import shuffle from '../../../utils/shuffle';
import ShortTermStatistics from '../common/ShortTermStatistics';
import CloseButton from '../common/CloseButton';
import ModalWindow from '../common/ModalWindow';
import StartWindow from '../common/StartWindow';
import Vocabulary from '../../vocabulary/Vocabulary';
import Statistics from '../../statistics/Statistics';

const {
  WORDS_DATA_URL,
  WORDS_AUDIOS_URL,
} = urls;

const {
  WORDS_TO_LEARN_TITLE,
  LEARNED_WORDS_TITLE,
} = vocabularyConstants;

export default class SprintGame {
  constructor(userState) {
    this.HTML = null;
    this.user = userState.user;
    // this.preloader = new Preloader();
    // this.audio = new Audio();
    // this.shortTermStatistics = new ShortTermStatistics();
    // this.error = 0;
    // this.modalWindow = new ModalWindow();
    this.startWindow = new StartWindow((this.GameBegin).bind(this));
    // this.closeButton = new CloseButton();
    this.vocabulary = new Vocabulary(this.user);
    // this.statistics = new Statistics(userState);
  }

  async SprintRender() {
    await this.vocabulary.init();
    const body = document.querySelector('body');
    const container = create('div', 'container main-container', '', body);
    const GameWindow = create('div', 'start-game-window', '', container);
    create('div', 'audition-game__startScreen', this.startWindow.render('SPRINT', sprint.GAME_RULES, this.CheckVocabularyLength()), GameWindow);
    this.Timer = create('span', 'timer', '', body);
    this.TimerAudio = create('audio', 'timer-audio', '', body);
    this.TimerAudio.src = 'src/assets/audio/timer.mp3';
    this.GameContainer = create('div', 'game-container none', '', body);
    this.GameAudio = create('audio', 'game-audio', '', this.GameContainer);
    this.GameAudio.src = "src/assets/audio/game_audio/4.mp3";
    this.GameAudio.loop = true;
    this.GameAudio.volume = 0.5;
    this.GameAudioButton = create('div', 'game-audio_button', '', this.GameContainer);
    this.Score = create('div', 'score', '0', this.GameContainer);
    this.GameAnswers = create('div', 'game_answers-container', '', this.GameContainer);
    this.Factor = create('p', 'factor', '+10 очков за слово', this.GameContainer);
    this.Word = create('h1', 'word', 'СЛОВО', this.GameContainer);
    this.AudioWord = create('audio', 'audio-word_game', '', this.GameContainer);
    this.Translation = create('h1', 'Translation', 'ПЕРЕВОД', this.GameContainer);
    this.answerButtonsContainer = create('div', 'answers_buttons-container', '', this.GameContainer);
    this.NoButton = create('button', 'no-button', 'No', this.answerButtonsContainer);
    this.YesButton = create('button', 'yes-button', 'Yes', this.answerButtonsContainer);
    this.countdown = create('div', 'countdown', '', body);
    this.StatContainer = create('div', 'stat-container none', '', body);
    this.finalScore = create('h1', 'final-score', '', this.StatContainer);
    this.IncorrectStatContainer = create('div', 'incorrect-stat-container', '', this.StatContainer);
    this.incorrect_answers = create('p', 'incorrect-answers', 'Ошибок: ', this.IncorrectStatContainer);
    this.CorrectStatContainer = create('div', 'correct-stat-container', '', this.StatContainer);
    this.correct_answers = create('p', 'correct-answers', 'Знаю: ', this.CorrectStatContainer);
    this.restartButton = create('button', 'restart-button', 'Новая игра', this.StatContainer);
    this.audio = create('audio', 'audio', '', body);
    this.AudioAnswers = create('div', 'audio-answers', '', body);
    this.CorrectAnswer = create('audio', 'correct-answer', '', this.AudioAnswers);
    this.CorrectAnswer.src = "src/assets/audio/correct.mp3";
    this.WrongAnswer = create('audio', 'wrong-answer', '', this.AudioAnswers);
    this.WrongAnswer.src = "src/assets/audio/error.mp3";
    this.SoundIcon = create('div', 'sound-icon', '', this.GameContainer);
    this.EndSoundGame = create('audio', '', '', body);
    this.EndSoundGame.src = "src/assets/audio/end.mp3";
    const closeButton = document.querySelector('.exit-button');
    const yesButton = document.querySelector('.yes-button');
    const noButton = document.querySelector('.no-button');
    const restartButton = document.querySelector('.restart-button');
    const GameAudio = document.querySelector('.game-audio');
    const WrongAnswer = document.querySelector('.wrong-answer');
    const CorrectAnswer = document.querySelector('.correct-answer');
    const SoundIcon = document.querySelector('.sound-icon');
    const STAT_CONTAINER = document.querySelector('.stat-container');
    const Word = document.querySelector(".word");
    const AudioWord = document.querySelector(".audio-word_game");
    const GameAudioButton = document.querySelector(".game-audio_button");
    let counter = 4;
    document.addEventListener('click', (e) => {
      if (e.target.classList[0] === 'yes-button') {
        if (window.answer) this.Correct();
        else this.Incorrect();
        this.GetWordData();
        Disabled();
        }
      if (e.target.classList[0] === 'no-button') {
        if (!window.answer) this.Correct();
        else this.Incorrect();
        this.GetWordData();
        Disabled();
        }
        function Disabled() {
        yesButton.disabled = true;
        setTimeout(() => { yesButton.disabled = false; }, 1000);
        noButton.disabled = true;
        setTimeout(() => { noButton.disabled = false; }, 1000);
        yesButton.disabled = true;
        }
        switch (e.target) {
          case restartButton:
            this.ClearGameData();
            break;
          case SoundIcon:
            SoundIcon.classList.toggle('muted');
            WrongAnswer.muted = (WrongAnswer.muted) ? false : true;
            CorrectAnswer.muted = (CorrectAnswer.muted) ? false : true;
            GameAudio.muted = (GameAudio.muted) ? false : true;
            break;
          case Word:
            AudioWord.play();
            break;
          case GameAudioButton:
            if(counter !== 7) counter++;
            else counter = 1;
            GameAudio.src = `src/assets/audio/game_audio/${counter}.mp3`;
            GameAudio.play();
            break;
          default:
            break;
        }
        if (e.target.classList[0] === 'audio-icon') e.target.childNodes[0].play();

    });
    return this.HTML;
  }

  GameBegin() {
    const StartGameWindow = document.querySelector('.start-game-window');
    this.WordSelected = document.querySelector('.gameWindow__learn-words-select').value;
    this.LvlSelect = document.querySelector('#selectGroup').value;
    StartGameWindow.classList.add('none');
    this.Timer.classList.add('block');
    //this.exitButton.classList.add('none');
    this.StatContainer.classList.remove('flex');
    this.StatContainer.classList.add('none');
		setTimeout(() => {
			this.TimerAudio.play();
		}, 1000);
    const sec = 5;
    let timeLeft = sec;
    const timer = setInterval(() => {
      if (timeLeft > 0) {
        this.Timer.innerHTML = timeLeft;
        timeLeft -= 1;
      } else {
        clearInterval(timer);
        this.TimerAudio.pause();
        this.TimerAudio.currentTime = 0;
        this.Game();
        this.GameTimerLeft();
      }
    }, 1000);
  }

  CheckVocabularyLength() {
    let result = false;
    if (this.vocabulary.getVocabularyWordsLength(WORDS_TO_LEARN_TITLE) > 30) result = true;
    return result;
  }

  Random(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

  Game() {
    this.Timer.classList.remove('block');
    //this.exitButton.classList.remove('none');
    this.Timer.innerHTML = '';
    this.GameContainer.classList.remove('none');
    this.GameContainer.classList.add('flex');
    window.correctAnswers = 0;
    this.GetWordData();
  }

  async GetWordData() {
    const vocLength = this.vocabulary.getVocabularyWordsLength(WORDS_TO_LEARN_TITLE);
    const vocWords = this.vocabulary.getWordsByVocabularyType(WORDS_TO_LEARN_TITLE);
    console.log(this.WordSelected);
    if (this.WordSelected === 'LEARNED_WORDS' && vocLength > 9) {
      this.WordGameRender(vocWords[this.Random(vocLength)].optional.allData,
      vocWords[this.Random(vocLength)].optional.allData);
    }
    else {
    const ARRAY_WORDS = await getWords(this.Random(30), this.LvlSelect);
    const RANDOM_WORD = await getWords(this.Random(30), this.LvlSelect);
    this.WordGameRender(ARRAY_WORDS[this.Random(20)], RANDOM_WORD[this.Random(20)]);
    }
  }

  async WordGameRender(word, randomWord) {
    console.log(word, randomWord);
  	const arr = [randomWord.wordTranslate, word.wordTranslate];
    this.Word.innerHTML = word.word;
    this.Translation.innerHTML = arr[this.Random(2)];
    window.answer = this.Translation.innerHTML === arr[1];
    window.ScoreTranslate = word.wordTranslate;
    this.playAudio(`${WORDS_AUDIOS_URL}${word.audio}`);
  }

  playAudio(source) {
    window.AUDIO_WORD_SRC = source;
    this.AudioWord.src = window.AUDIO_WORD_SRC;
  }

  Correct() {
  	let power = sprint.POWER1;
  	window.correctAnswers += 1;
  	this.GameAnswers.innerHTML += sprint.RIGHT_ANSWER;
  	if (window.correctAnswers >= sprint.CORRECT1) power = sprint.POWER2;
  	if (window.correctAnswers >= sprint.CORRECT2) power = sprint.POWER3;
  	if (window.correctAnswers >= sprint.CORRECT3) power = sprint.POWER4;
  	if (window.correctAnswers % sprint.BONUS_ANSWERS === 0 && window.correctAnswers !== 0) window.countdown += sprint.BONUS_TIME;
  	if ((window.correctAnswers) % 4 === 0) this.GameAnswers.innerHTML = '';
  	const prevScore = this.Score.innerHTML;
  	this.Factor.innerHTML = `+${power * 10} очков за слово`;
  	this.Score.innerHTML = +prevScore + 10 * power;
  	const ANSWER_CONT = document.createElement('div');
  	ANSWER_CONT.classList.toggle('answer-cont');
  	this.CorrectStatContainer.append(ANSWER_CONT);
  	const AUDIO_DIV = document.createElement('div');
  	AUDIO_DIV.classList.toggle('audio-icon');
  	ANSWER_CONT.append(AUDIO_DIV);
  	const audio = document.createElement('audio');
  	audio.src = window.AUDIO_WORD_SRC;
  	AUDIO_DIV.append(audio);
  	const p = document.createElement('p');
  	p.classList.toggle('correct');
  	p.innerHTML = `${this.Word.innerHTML} - ${window.ScoreTranslate}`;
  	ANSWER_CONT.append(p);
  	this.CorrectAnswer.play();
  }

  Incorrect() {
  	window.correctAnswers = 0;
  	this.Factor.innerHTML = '+10 очков за слово';
  	this.GameAnswers.innerHTML = '';
  	const ANSWER_CONT = document.createElement('div');
  	ANSWER_CONT.classList.toggle('answer-cont');
  	this.IncorrectStatContainer.append(ANSWER_CONT);
  	const AUDIO_DIV = document.createElement('div');
  	AUDIO_DIV.classList.toggle('audio-icon');
  	ANSWER_CONT.append(AUDIO_DIV);
  	const audio = document.createElement('audio');
  	audio.src = window.AUDIO_WORD_SRC;
  	AUDIO_DIV.append(audio);
  	const p = document.createElement('p');
  	p.classList.toggle('incorrect');
  	p.innerHTML = `${this.Word.innerHTML} - ${window.ScoreTranslate}`;
  	ANSWER_CONT.append(p);
  	this.WrongAnswer.play();
  }

  GameTimerLeft() {
    this.countdown.innerHTML = `
		<div class="countdown-number"></div>
		<svg>
    	<circle r="18" cx="20" cy="20"></circle>
		</svg>`;
		this.GameAudio.play();
    const countdownNumberEl = document.querySelector('.countdown-number');
    window.countdown = sprint.GAME_TIMER;
    countdownNumberEl.textContent = window.countdown;
    const self = this;
    window.myTimer = setInterval(() => {
      window.countdown -= 1;
      if (window.countdown === 0) {
        clearInterval(window.myTimer);
        window.countdown = '';
        this.GameAudio.pause();
        this.GameAudio.currentTime = 0;
        self.EndGame();
      }
      countdownNumberEl.textContent = window.countdown;
    }, 1000);
  }

  EndGame() {
  	this.EndSoundGame.play();
    this.countdown.innerHTML = '';
    this.Factor.innerHTML = 'X1';
    this.GameContainer.classList.remove('flex');
    this.GameContainer.classList.add('none');
    this.StatContainer.classList.add('flex');
    this.StatContainer.classList.remove('none');
    //this.exitButton.classList.add('none');
    this.finalScore.innerHTML = `${sprint.SCORE} ${this.Score.innerHTML}`;
    const errors = document.getElementsByClassName('incorrect');
    this.incorrect_answers.innerHTML += errors.length;
    const rights = document.getElementsByClassName('correct');
    this.correct_answers.innerHTML += rights.length;
    this.Translation.innerHTML = 'ПЕРЕВОД';
    this.Word.innerHTML = 'СЛОВО';
    this.GameAudio.pause();
    this.GameAudio.currentTime = 0;
  }

  ClearGameData() {
    this.incorrect_answers.innerHTML = sprint.CORRECT_ANSWERS;
    this.correct_answers.innerHTML = sprint.INCORRECT_ANSWERS;
    this.Score.innerHTML = '0';
    this.finalScore.innerHTML = '';
    this.GameAnswers.innerHTML = '';
    window.correctAnswers = 0;
    window.incorrectAnswers = 0;
    while (this.IncorrectStatContainer.childNodes.length > 1) {
    	this.IncorrectStatContainer.removeChild(this.IncorrectStatContainer.lastChild);
  	}
 		while (this.CorrectStatContainer.childNodes.length > 1) {
    	this.CorrectStatContainer.removeChild(this.CorrectStatContainer.lastChild);
  	}
    this.GameBegin();
  }

  Close() {
    const answer = confirm(sprint.EXIT_ANSWER);
    return answer;
  }

  Home() {
    const StartGameWindow = document.querySelector('.start-game-window');
    StartGameWindow.classList.remove('none');
    this.GameContainer.classList.remove('flex');
    this.GameContainer.classList.add('none');
    this.Translation.innerHTML = 'ПЕРЕВОД';
    this.Word.innerHTML = 'СЛОВО';
    this.countdown.innerHTML = '';
    clearInterval(window.myTimer);
    this.GameAudio.pause();
		this.GameAudio.currentTime = 0;
		this.GameAnswers.innerHTML = '';
  }
}
