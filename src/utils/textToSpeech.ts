
export const speak = (text: string, language: string = 'en') => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'en' ? 'en-US' : language;
    window.speechSynthesis.speak(utterance);
  }
};
