// enlaces candidatos a datasheets oficiales (fabricante) por pieza del simulador; checkLinks.js los verifica
const TI = p => 'https://www.ti.com/product/' + p;
const ON = f => 'https://www.onsemi.com/pdf/datasheet/' + f + '.pdf';
const MC = p => 'https://www.microchip.com/en-us/product/' + p;
module.exports = {
  /* integrados (clave de Lab.IC) */
  '293': ['Texas Instruments', TI('L293D')], '324': ['Texas Instruments', TI('LM324')], '358': ['Texas Instruments', TI('LM358')],
  '555': ['Texas Instruments', TI('NE555')], '556': ['Texas Instruments', TI('NE556')], '741': ['Texas Instruments', TI('LM741')],
  '2003': ['Texas Instruments', TI('ULN2003A')],
  '4001': ['Texas Instruments', TI('CD4001B')], '4011': ['Texas Instruments', TI('CD4011B')], '4013': ['Texas Instruments', TI('CD4013B')],
  '4017': ['Texas Instruments', TI('CD4017B')], '4026': ['Texas Instruments', TI('CD4026B')], '4051': ['Texas Instruments', TI('CD4051B')],
  '4069': ['Texas Instruments', TI('CD4069UB')], '4070': ['Texas Instruments', TI('CD4070B')], '4071': ['Texas Instruments', TI('CD4071B')],
  '4081': ['Texas Instruments', TI('CD4081B')], '4093': ['Texas Instruments', TI('CD4093B')], '4511': ['Texas Instruments', TI('CD4511B')],
  '7266': ['Texas Instruments', TI('CD74HC7266')], '7400': ['Texas Instruments', TI('SN74HC00')], '7402': ['Texas Instruments', TI('SN74HC02')],
  '7404': ['Texas Instruments', TI('SN74HC04')], '7408': ['Texas Instruments', TI('SN74HC08')], '7410': ['Texas Instruments', TI('SN74HC10')],
  '7411': ['Texas Instruments', TI('SN74HC11')], '7414': ['Texas Instruments', TI('SN74HC14')], '7420': ['Texas Instruments', TI('SN74HC20')],
  '7432': ['Texas Instruments', TI('SN74HC32')], '7447': ['Texas Instruments', TI('SN74LS47')], 
  '7473': ['Texas Instruments', TI('CD74HC73')], '7474': ['Texas Instruments', TI('SN74HC74')], 
  '7486': ['Texas Instruments', TI('SN74HC86')], '74138': ['Texas Instruments', TI('SN74HC138')], '74151': ['Texas Instruments', TI('SN74HC151')],
  '74164': ['Texas Instruments', TI('SN74HC164')], '74190': ['Texas Instruments', TI('CD74HC190')], '74193': ['Texas Instruments', TI('SN74HC193')],
  '74283': ['Texas Instruments', TI('CD74HC283')], '74595': ['Texas Instruments', TI('SN74HC595')],
  'adc0804': ['Texas Instruments', TI('ADC0804-N')], 'dac0808': ['Texas Instruments', TI('DAC0808')], 'tl494': ['Texas Instruments', TI('TL494')],
  '74ls00': ['Texas Instruments', TI('SN74LS00')], '74ls02': ['Texas Instruments', TI('SN74LS02')], '74ls04': ['Texas Instruments', TI('SN74LS04')],
  '74ls08': ['Texas Instruments', TI('SN74LS08')], '74ls32': ['Texas Instruments', TI('SN74LS32')], '74ls86': ['Texas Instruments', TI('SN74LS86A')],
  'tl081': ['Texas Instruments', TI('TL081')], 'tl082': ['Texas Instruments', TI('TL082')], 'tl084': ['Texas Instruments', TI('TL084')],
  'lm339': ['Texas Instruments', TI('LM339')], 'lm393': ['Texas Instruments', TI('LM393')], 'lm386': ['Texas Instruments', TI('LM386')],
  'pc817': ['Sharp', 'https://global.sharp/products/device/lineup/data/pdf/datasheet/PC817XxNSZ1B_e.pdf'],
  '4n25': ['Vishay', 'https://www.vishay.com/docs/83725/4n25.pdf'],
  /* microcontroladores (Lab.MCU) */
  'mcu:esp32': ['Espressif', 'https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf'],
  'mcu:esp32v1': ['Espressif', 'https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf'],
  'mcu:esp32c': ['Espressif', 'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32/esp32-devkitc/index.html'],
  'mcu:atmega328p': ['Microchip', MC('ATmega328P')], 'mcu:pic18f4550': ['Microchip', MC('PIC18F4550')],
  'mcu:pic16f877a': ['Microchip', MC('PIC16F877A')], 'mcu:pic16f84a': ['Microchip', MC('PIC16F84A')],
  /* piezas (PARTS) */
  diode: ['onsemi', ON('1n4001-d')], reg: ['Texas Instruments', TI('LM340')],
  bjt2222: ['onsemi', ON('p2n2222a-d')], bjt3904: ['onsemi', ON('2n3903-d')], pnp3906: ['onsemi', ON('2n3906-d')],
  tip120: ['onsemi', ON('tip120-d')], tip42: ['onsemi', ON('tip41a-d')], tip31: ['onsemi', ON('tip31a-d')], tip32: ['onsemi', ON('tip31a-d')],
  bc547: ['onsemi', ON('bc546-d')], bc548: ['onsemi', ON('bc546-d')], bc557: ['onsemi', ON('bc556b-d')],
  irfz44n: ['Infineon', 'https://www.infineon.com/cms/en/product/power/mosfet/n-channel/irfz44n/'],
  irf540n: ['Infineon', 'https://www.infineon.com/cms/en/product/power/mosfet/n-channel/irf540n/'],
  mos2n7000: ['onsemi', ON('nds7002a-d')], regneg: ['onsemi', ON('mc7900-d')], lm317: ['Texas Instruments', TI('LM317')],
  lm35: ['Texas Instruments', TI('LM35')], lm336: ['Texas Instruments', TI('LM336-2.5')], zener: ['onsemi', ON('1n5221b-d')],
  tcrt: ['Vishay', 'https://www.vishay.com/docs/83760/tcrt5000.pdf'],
  l298n: ['STMicroelectronics', 'https://www.st.com/resource/en/datasheet/l298.pdf'],
  uln_mod: ['Texas Instruments', TI('ULN2003A')],
  lcdi2c16: ['Texas Instruments', TI('PCF8574')], lcdi2c20: ['Texas Instruments', TI('PCF8574')], lcdi2c: ['Texas Instruments', TI('PCF8574')],
  mpu6050: ['TDK InvenSense', 'https://invensense.tdk.com/products/motion-tracking/6-axis/mpu-6050/'],
  arduino: ['Arduino', 'https://docs.arduino.cc/hardware/uno-rev3/'],
  scope4: ['Rigol', 'https://www.rigolna.com/products/digital-oscilloscopes/1000z/'],
  /* copias públicas cuando el fabricante ya no publica el PDF */
  lcd: ['Hitachi (copia de SparkFun)', 'https://www.sparkfun.com/datasheets/LCD/HD44780.pdf'],
  oled: ['Solomon Systech (copia de Adafruit)', 'https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf'],
};
