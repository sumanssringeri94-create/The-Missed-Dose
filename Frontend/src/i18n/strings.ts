export type SupportedLanguage = 'en' | 'hi' | 'kn' | 'ta'

export const strings: Record<SupportedLanguage, { listen: string; taken: string; recorded: string; missed: string; safety: string; profile: string; confirmDose: string; duplicate: string; emergency: string }> = {
  en: { listen: 'Listen', taken: 'Taken', recorded: 'Recorded', missed: 'Missed', safety: 'Safety', profile: 'Patient profile', confirmDose: 'Please check your prescription or ask your pharmacist or doctor what to do about this dose.', duplicate: 'Are you recording the same dose again?', emergency: 'Please contact a doctor, pharmacist or emergency service now.' },
  hi: { listen: 'सुनें', taken: 'ली', recorded: 'दर्ज', missed: 'छूटी', safety: 'सुरक्षा', profile: 'मरीज़ की जानकारी', confirmDose: 'कृपया अपना प्रिस्क्रिप्शन देखें या इस खुराक के बारे में फार्मासिस्ट या डॉक्टर से पूछें।', duplicate: 'क्या आप वही खुराक फिर से दर्ज कर रहे हैं?', emergency: 'कृपया अभी डॉक्टर, फार्मासिस्ट या आपातकालीन सेवा से संपर्क करें।' },
  kn: { listen: 'ಕೇಳಿ', taken: 'ತೆಗೆದುಕೊಂಡೆ', recorded: 'ದಾಖಲಾಗಿದೆ', missed: 'ತಪ್ಪಿದೆ', safety: 'ಸುರಕ್ಷತೆ', profile: 'ರೋಗಿಯ ವಿವರ', confirmDose: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ನೋಡಿ ಅಥವಾ ಈ ಔಷಧಿಯ ಬಗ್ಗೆ ಫಾರ್ಮಸಿಸ್ಟ್ ಅಥವಾ ವೈದ್ಯರನ್ನು ಕೇಳಿ.', duplicate: 'ನೀವು ಅದೇ ಪ್ರಮಾಣವನ್ನು ಮತ್ತೆ ದಾಖಲಿಸುತ್ತಿದ್ದೀರಾ?', emergency: 'ದಯವಿಟ್ಟು ಈಗ ವೈದ್ಯರು, ಫಾರ್ಮಸಿಸ್ಟ್ ಅಥವಾ ತುರ್ತು ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ.' },
  ta: { listen: 'கேளுங்கள்', taken: 'எடுத்தேன்', recorded: 'பதிவானது', missed: 'தவறியது', safety: 'பாதுகாப்பு', profile: 'நோயாளி விவரம்', confirmDose: 'தயவுசெய்து உங்கள் மருந்துச் சீட்டைப் பார்க்கவும் அல்லது இந்த அளவைப் பற்றி மருந்தாளரிடம் அல்லது மருத்துவரிடம் கேட்கவும்.', duplicate: 'அதே அளவை மீண்டும் பதிவு செய்கிறீர்களா?', emergency: 'தயவுசெய்து உடனே மருத்துவர், மருந்தாளர் அல்லது அவசர சேவையைத் தொடர்புகொள்ளவும்.' },
}

export const speechLocales: Record<SupportedLanguage, string> = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN', ta: 'ta-IN' }
