# Microcontroladores y placas

Microcontroladores que el simulador programa (C de Arduino, ensamblador o .HEX).

> Las patas y los rangos de esta ficha son los que usa VectraLab 22 al simular. Para diseñar un circuito real manda siempre el datasheet del fabricante.

## ESP32 DevKit V1 (30 pines)

Wi-Fi y Bluetooth, lógica de 3,3 V: sus pines no aceptan 5 V. Alimentado por USB: el pin 3V3 entrega 3,3 V y VIN entrega 5 V.

- Chip: ESP32-WROOM-32
- Patas: 30

**Datasheet:** [Espressif](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf)  
Datasheet del chip ESP32; la placa DevKit V1 de 30 pines (DOIT) no tiene documentación oficial de Espressif.

| Pata | Nombre |
|---:|---|
| 1 | EN |
| 2 | VP |
| 3 | VN |
| 4 | D34 |
| 5 | D35 |
| 6 | D32 |
| 7 | D33 |
| 8 | D25 |
| 9 | D26 |
| 10 | D27 |
| 11 | D14 |
| 12 | D12 |
| 13 | D13 |
| 14 | GND |
| 15 | VIN |
| 16 | 3V3 |
| 17 | GND |
| 18 | D15 |
| 19 | D2 |
| 20 | D4 |
| 21 | RX2 |
| 22 | TX2 |
| 23 | D5 |
| 24 | D18 |
| 25 | D19 |
| 26 | D21 |
| 27 | RX0 |
| 28 | TX0 |
| 29 | D22 |
| 30 | D23 |

## ESP32 DevKit V1 (38 pines)

Versión de 38 pines. Lógica de 3,3 V: sus pines no aceptan 5 V. Por USB: 3V3 entrega 3,3 V y 5V entrega 5 V. Los pines SD0–SD3, CMD y CLK son de la memoria flash: no los uses.

- Chip: ESP32-WROOM-32
- Patas: 38

**Datasheet:** [Espressif](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf)  
Datasheet del chip ESP32; la placa DevKit V1 de 38 pines no tiene documentación oficial de Espressif.

| Pata | Nombre |
|---:|---|
| 1 | CLK |
| 2 | SD0 |
| 3 | SD1 |
| 4 | D15 |
| 5 | D2 |
| 6 | D0 |
| 7 | D4 |
| 8 | D16 |
| 9 | D17 |
| 10 | D5 |
| 11 | D18 |
| 12 | D19 |
| 13 | GND |
| 14 | D21 |
| 15 | RX0 |
| 16 | TX0 |
| 17 | D22 |
| 18 | D23 |
| 19 | GND |
| 20 | 3V3 |
| 21 | EN |
| 22 | VP |
| 23 | VN |
| 24 | D34 |
| 25 | D35 |
| 26 | D32 |
| 27 | D33 |
| 28 | D25 |
| 29 | D26 |
| 30 | D27 |
| 31 | D14 |
| 32 | D12 |
| 33 | GND |
| 34 | D13 |
| 35 | SD2 |
| 36 | SD3 |
| 37 | CMD |
| 38 | 5V |

## ESP32 DevKitC V4 (38 pines)

Placa oficial de Espressif. No trae LED de usuario: conecta uno con resistor al GPIO 2. Lógica de 3,3 V. Los pines SD0–SD3, CMD y CLK son de la memoria flash.

- Chip: ESP32-WROOM-32
- Patas: 38

**Datasheet:** [Espressif](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32/esp32-devkitc/index.html)  
Guía oficial de la placa ESP32-DevKitC V4, con esquema y pinout.

| Pata | Nombre |
|---:|---|
| 1 | 3V3 |
| 2 | EN |
| 3 | VP |
| 4 | VN |
| 5 | D34 |
| 6 | D35 |
| 7 | D32 |
| 8 | D33 |
| 9 | D25 |
| 10 | D26 |
| 11 | D27 |
| 12 | D14 |
| 13 | D12 |
| 14 | GND |
| 15 | D13 |
| 16 | SD2 |
| 17 | SD3 |
| 18 | CMD |
| 19 | 5V |
| 20 | CLK |
| 21 | SD0 |
| 22 | SD1 |
| 23 | D15 |
| 24 | D2 |
| 25 | D0 |
| 26 | D4 |
| 27 | D16 |
| 28 | D17 |
| 29 | D5 |
| 30 | D18 |
| 31 | D19 |
| 32 | GND |
| 33 | D21 |
| 34 | RX0 |
| 35 | TX0 |
| 36 | D22 |
| 37 | D23 |
| 38 | GND |

## ATmega328P (DIP-28, Arduino en protoboard)

El chip del Arduino Uno suelto en la protoboard: alimenta VCC (7) y AVCC (20) con 5 V y GND (8, 22). Se programa igual que el Uno (C de Arduino, ensamblador AVR o .HEX) y usa la misma numeración D0–D13 y A0–A5.

- Chip: ATMEGA328P-PU
- Patas: 28
- Alimentación en el simulador: 2,7 a 5,5 V (daño sobre 6 V)

**Datasheet:** [Microchip](https://www.microchip.com/en-us/product/ATmega328P)

| Pata | Nombre |
|---:|---|
| 1 | RESET |
| 2 | D0/RXD |
| 3 | D1/TXD |
| 4 | D2 |
| 5 | D3 |
| 6 | D4 |
| 7 | VCC |
| 8 | GND |
| 9 | XTAL1 |
| 10 | XTAL2 |
| 11 | D5 |
| 12 | D6 |
| 13 | D7 |
| 14 | D8 |
| 15 | D9 |
| 16 | D10 |
| 17 | D11/MOSI |
| 18 | D12/MISO |
| 19 | D13/SCK |
| 20 | AVCC |
| 21 | AREF |
| 22 | GND |
| 23 | A0 |
| 24 | A1 |
| 25 | A2 |
| 26 | A3 |
| 27 | A4/SDA |
| 28 | A5/SCL |

## PIC18F4550 (40 pines, USB)

PIC de 8 bits con USB. Necesita VDD (11 y 32) a 5 V, VSS (12 y 31) a tierra y MCLR (1) en alto con una resistencia de 10 kΩ. Se asume el cristal funcionando.

- Chip: PIC18F4550-I/P
- Patas: 40
- Alimentación en el simulador: 4,2 a 5,5 V (daño sobre 6,5 V)

**Datasheet:** [Microchip](https://www.microchip.com/en-us/product/PIC18F4550)

| Pata | Nombre |
|---:|---|
| 1 | MCLR |
| 2 | RA0/AN0 |
| 3 | RA1/AN1 |
| 4 | RA2/AN2 |
| 5 | RA3/AN3 |
| 6 | RA4 |
| 7 | RA5/AN4 |
| 8 | RE0/AN5 |
| 9 | RE1/AN6 |
| 10 | RE2/AN7 |
| 11 | VDD |
| 12 | VSS |
| 13 | OSC1 |
| 14 | OSC2/RA6 |
| 15 | RC0 |
| 16 | RC1 |
| 17 | RC2 |
| 18 | VUSB |
| 19 | RD0 |
| 20 | RD1 |
| 21 | RD2 |
| 22 | RD3 |
| 23 | RC4 |
| 24 | RC5 |
| 25 | RC6/TX |
| 26 | RC7/RX |
| 27 | RD4 |
| 28 | RD5 |
| 29 | RD6 |
| 30 | RD7 |
| 31 | VSS |
| 32 | VDD |
| 33 | RB0/AN12 |
| 34 | RB1/AN10 |
| 35 | RB2/AN8 |
| 36 | RB3/AN9 |
| 37 | RB4/AN11 |
| 38 | RB5 |
| 39 | RB6 |
| 40 | RB7 |

## PIC16F877A (40 pines)

El PIC clásico de 40 pines. VDD (11 y 32) a 5 V, VSS (12 y 31) a tierra y MCLR (1) en alto con 10 kΩ. Se asume el cristal funcionando.

- Chip: PIC16F877A-I/P
- Patas: 40
- Alimentación en el simulador: 4 a 5,5 V (daño sobre 6,5 V)

**Datasheet:** [Microchip](https://www.microchip.com/en-us/product/PIC16F877A)

| Pata | Nombre |
|---:|---|
| 1 | MCLR |
| 2 | RA0/AN0 |
| 3 | RA1/AN1 |
| 4 | RA2/AN2 |
| 5 | RA3/AN3 |
| 6 | RA4 |
| 7 | RA5/AN4 |
| 8 | RE0/AN5 |
| 9 | RE1/AN6 |
| 10 | RE2/AN7 |
| 11 | VDD |
| 12 | VSS |
| 13 | OSC1 |
| 14 | OSC2 |
| 15 | RC0 |
| 16 | RC1 |
| 17 | RC2 |
| 18 | RC3 |
| 19 | RD0 |
| 20 | RD1 |
| 21 | RD2 |
| 22 | RD3 |
| 23 | RC4 |
| 24 | RC5 |
| 25 | RC6/TX |
| 26 | RC7/RX |
| 27 | RD4 |
| 28 | RD5 |
| 29 | RD6 |
| 30 | RD7 |
| 31 | VSS |
| 32 | VDD |
| 33 | RB0/AN12 |
| 34 | RB1/AN10 |
| 35 | RB2/AN8 |
| 36 | RB3/AN9 |
| 37 | RB4/AN11 |
| 38 | RB5 |
| 39 | RB6 |
| 40 | RB7 |

## PIC16F84A (18 pines)

PIC pequeño de 18 pines, sin conversor analógico. VDD (14) a 5 V, VSS (5) a tierra y MCLR (4) en alto con 10 kΩ.

- Chip: PIC16F84A-04/P
- Patas: 18
- Alimentación en el simulador: 4 a 5,5 V (daño sobre 6,5 V)

**Datasheet:** [Microchip](https://www.microchip.com/en-us/product/PIC16F84A)

| Pata | Nombre |
|---:|---|
| 1 | RA2 |
| 2 | RA3 |
| 3 | RA4 |
| 4 | MCLR |
| 5 | VSS |
| 6 | RB0 |
| 7 | RB1 |
| 8 | RB2 |
| 9 | RB3 |
| 10 | RB4 |
| 11 | RB5 |
| 12 | RB6 |
| 13 | RB7 |
| 14 | VDD |
| 15 | OSC2 |
| 16 | OSC1 |
| 17 | RA0 |
| 18 | RA1 |
