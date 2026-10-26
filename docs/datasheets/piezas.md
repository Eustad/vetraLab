# Piezas, módulos e instrumentos

Piezas de la protoboard, módulos y equipos de la mesa.

> Las patas y los rangos de esta ficha son los que usa VectraLab 22 al simular. Para diseñar un circuito real manda siempre el datasheet del fabricante.

## En la protoboard

### Resistor

**Datasheet:** sin enlace. Pieza genérica (película de carbón o metálica, 1/4 W); cada fabricante publica su serie.

| Terminal | Función |
|---|---|
| A | terminal 1 |
| B | terminal 2 |

### Diodo rectificador 1N4007

**Datasheet:** [onsemi](https://www.onsemi.com/pdf/datasheet/1n4001-d.pdf)  
El documento cubre 1N4001 a 1N4007.

| Terminal | Función |
|---|---|
| A | ánodo |
| K | cátodo |

### LED de 5 mm

**Datasheet:** sin enlace. LED genérico de 5 mm; cada fabricante publica el suyo (Vf y corriente varían por color).

| Terminal | Función |
|---|---|
| A | ánodo (+) |
| K | cátodo (−) |

### Capacitor electrolítico

**Datasheet:** sin enlace. Electrolítico radial genérico; la serie exacta depende del fabricante (Nichicon, Panasonic, Rubycon…).

| Terminal | Función |
|---|---|
| + | positivo |
| - | negativo (franja) |

### Capacitor cerámico

**Datasheet:** sin enlace. Cerámico de disco genérico.

| Terminal | Función |
|---|---|
| 1 | terminal 1 |
| 2 | terminal 2 |

### Potenciómetro

**Datasheet:** sin enlace. Potenciómetro genérico.

| Terminal | Función |
|---|---|
| 1 | extremo 1 |
| W | cursor |
| 3 | extremo 3 |

### Pulsador

**Datasheet:** sin enlace. Pulsador táctil genérico de 6 × 6 mm.

| Terminal | Función |
|---|---|
| 1 | terminal 1 |
| 2 | terminal 2 |

### Regulador LM7805 (TO-220)

**Datasheet:** [Texas Instruments](https://www.ti.com/product/LM340)  
TI publica el LM7805 dentro de la familia LM340 (LM340-5 = 7805).

| Terminal | Función |
|---|---|
| IN | entrada |
| GND | tierra |
| OUT | salida 5 V |

### Display de 7 segmentos

**Datasheet:** sin enlace. Display de 7 segmentos genérico.

### Interruptor DIP

**Datasheet:** sin enlace. Interruptor DIP genérico.

### Pantalla LCD (bus paralelo)

**Datasheet:** [Hitachi (copia de SparkFun)](https://www.sparkfun.com/datasheets/LCD/HD44780.pdf)  
Hitachi ya no publica el HD44780; el enlace es la copia pública que aloja SparkFun.

| Terminal | Función |
|---|---|
| VSS | tierra |
| VDD | +5 V |
| V0 | contraste |
| RS | registro (comando/dato) |
| RW | lectura/escritura |
| E | habilitación |
| D0 |  |
| D1 |  |
| D2 |  |
| D3 |  |
| D4 |  |
| D5 |  |
| D6 |  |
| D7 |  |
| A | luz de fondo + |
| K | luz de fondo − |

### Transistor NPN 2N2222A (TO-92)

**Datasheet:** [onsemi](https://www.onsemi.com/pdf/datasheet/p2n2222a-d.pdf)

| Terminal | Función |
|---|---|
| E | emisor |
| B | base |
| C | colector |

### Darlington NPN TIP120 (TO-220)

**Datasheet:** [onsemi](https://www.onsemi.com/pdf/datasheet/tip120-d.pdf)

| Terminal | Función |
|---|---|
| B | base |
| C | colector |
| E | emisor |

### Transistor NPN 2N3904 / 2N3903 (TO-92)

**Datasheet:** [onsemi](https://www.onsemi.com/pdf/datasheet/2n3903-d.pdf)  
El documento cubre 2N3903 y 2N3904.

| Terminal | Función |
|---|---|
| E | emisor |
| B | base |
| C | colector |

### Transistor PNP 2N3906 / 2N3905 (TO-92)

**Datasheet:** [onsemi](https://www.onsemi.com/pdf/datasheet/2n3906-d.pdf)

| Terminal | Función |
|---|---|
| E | emisor |
| B | base |
| C | colector |

### Transistor PNP de potencia TIP42C (TO-220)

**Datasheet:** [onsemi](https://www.onsemi.com/pdf/datasheet/tip41a-d.pdf)  
El documento cubre TIP41A/B/C (NPN) y TIP42A/B/C (PNP).

| Terminal | Función |
|---|---|
| B | base |
| C | colector |
| E | emisor |

### Resistencia de potencia (tubular, 10 W)

**Datasheet:** sin enlace. Resistencia tubular de potencia genérica.

| Terminal | Función |
|---|---|
| A | terminal 1 |
| B | terminal 2 |

### Diodo zener (0,5 W)

**Datasheet:** [onsemi](https://www.onsemi.com/pdf/datasheet/1n5221b-d.pdf)  
Serie 1N5221B–1N5267B (0,5 W); elige la tensión que uses en el simulador.

| Terminal | Función |
|---|---|
| A | ánodo |
| K | cátodo (franja) |

### Referencia de voltaje LM336-2,5

**Datasheet:** [Texas Instruments](https://www.ti.com/product/LM336-2.5)  
Página de producto del LM336-2.5.

| Terminal | Función |
|---|---|
| ADJ | ajuste (puede quedar libre) |
| + | cátodo (+) |
| - | ánodo (−) |

### Inductor (choque radial)

**Datasheet:** sin enlace. Choque radial genérico.

| Terminal | Función |
|---|---|
| 1 | terminal 1 |
| 2 | terminal 2 |

### Pantalla LCD con módulo I2C

**Datasheet:** [Texas Instruments](https://www.ti.com/product/PCF8574)  
Datasheet del expansor PCF8574 del adaptador I²C; la pantalla usa el controlador HD44780.

| Terminal | Función |
|---|---|
| GND | tierra |
| VCC | +5 V |
| SDA | datos I2C |
| SCL | reloj I2C |

### Zumbador (buzzer activo 5 V)

**Datasheet:** sin enlace. Zumbador activo genérico.

| Terminal | Función |
|---|---|
| + | positivo (pata larga) |
| - | negativo |

### Fotorresistencia LDR (GL5528)

**Datasheet:** sin enlace. La GL5528 se vende sin datasheet de fabricante verificable.

| Terminal | Función |
|---|---|
| 1 | terminal 1 |
| 2 | terminal 2 |

### Transistor NPN BC547 (TO-92)

**Datasheet:** [onsemi](https://www.onsemi.com/pdf/datasheet/bc546-d.pdf)  
El documento cubre BC546, BC547 y BC548.

| Terminal | Función |
|---|---|
| C | colector |
| B | base |
| E | emisor |

### Transistor NPN BC548 (TO-92)

**Datasheet:** [onsemi](https://www.onsemi.com/pdf/datasheet/bc546-d.pdf)  
El documento cubre BC546, BC547 y BC548.

| Terminal | Función |
|---|---|
| C | colector |
| B | base |
| E | emisor |

### Transistor PNP BC557 (TO-92)

**Datasheet:** [onsemi](https://www.onsemi.com/pdf/datasheet/bc556b-d.pdf)  
El documento cubre BC556, BC557 y BC558.

| Terminal | Función |
|---|---|
| C | colector |
| B | base |
| E | emisor |

### Transistor NPN de potencia TIP31C (TO-220)

**Datasheet:** [onsemi](https://www.onsemi.com/pdf/datasheet/tip31a-d.pdf)  
El documento cubre TIP31A/B/C (NPN) y TIP32A/B/C (PNP).

| Terminal | Función |
|---|---|
| B | base |
| C | colector |
| E | emisor |

### Transistor PNP de potencia TIP32C (TO-220)

**Datasheet:** [onsemi](https://www.onsemi.com/pdf/datasheet/tip31a-d.pdf)  
El documento cubre TIP31A/B/C (NPN) y TIP32A/B/C (PNP).

| Terminal | Función |
|---|---|
| B | base |
| C | colector |
| E | emisor |

### MOSFET canal N IRFZ44N (TO-220)

**Datasheet:** [Infineon](https://www.infineon.com/cms/en/product/power/mosfet/n-channel/irfz44n/)

| Terminal | Función |
|---|---|
| G | compuerta |
| D | drenador |
| S | fuente |

### MOSFET canal N IRF540N (TO-220)

**Datasheet:** [Infineon](https://www.infineon.com/cms/en/product/power/mosfet/n-channel/irf540n/)

| Terminal | Función |
|---|---|
| G | compuerta |
| D | drenador |
| S | fuente |

### MOSFET canal N 2N7000 (TO-92)

**Datasheet:** [onsemi](https://www.onsemi.com/pdf/datasheet/nds7002a-d.pdf)  
El documento cubre 2N7000, 2N7002 y NDS7002A.

| Terminal | Función |
|---|---|
| S | fuente |
| G | compuerta |
| D | drenador |

### Regulador negativo 79xx (TO-220)

**Datasheet:** [onsemi](https://www.onsemi.com/pdf/datasheet/mc7900-d.pdf)  
Familia MC79xx (−5 V a −24 V).

| Terminal | Función |
|---|---|
| GND | tierra |
| IN | entrada negativa |
| OUT | salida negativa |

### Regulador ajustable LM317 (TO-220)

**Datasheet:** [Texas Instruments](https://www.ti.com/product/LM317)

| Terminal | Función |
|---|---|
| ADJ | ajuste |
| OUT | salida |
| IN | entrada |

### Sensor de temperatura LM35 (TO-92)

**Datasheet:** [Texas Instruments](https://www.ti.com/product/LM35)

| Terminal | Función |
|---|---|
| VCC | +4 a 30 V |
| VOUT | salida 10 mV/°C |
| GND | tierra |

### Termistor NTC 10 kΩ

**Datasheet:** sin enlace. Termistor NTC genérico de 10 kΩ (B ≈ 3950).

| Terminal | Función |
|---|---|
| 1 | terminal 1 |
| 2 | terminal 2 |

### Cristal de cuarzo (HC-49)

**Datasheet:** sin enlace. Cristal HC-49 genérico.

| Terminal | Función |
|---|---|
| 1 | terminal 1 |
| 2 | terminal 2 |

### LED RGB de cátodo común

**Datasheet:** sin enlace. LED RGB genérico de cátodo común.

| Terminal | Función |
|---|---|
| R | ánodo rojo |
| K | cátodo común (pata más larga) |
| G | ánodo verde |
| B | ánodo azul |

### Puente rectificador (DB107)

**Datasheet:** sin enlace. El DB107 lo fabrican varias marcas; el sitio de Diodes Inc. bloquea la verificación automática, así que no se enlaza.

| Terminal | Función |
|---|---|
| + | salida + |
| ~1 | entrada de alterna |
| ~2 | entrada de alterna |
| - | salida − |

### Interruptor deslizante SPDT

**Datasheet:** sin enlace. Interruptor deslizante genérico.

| Terminal | Función |
|---|---|
| 1 | posición 1 |
| C | común |
| 2 | posición 2 |

### Barra de 10 LEDs (DIP-20)

**Datasheet:** sin enlace. Barra de 10 LED genérica.

## En la mesa

### Kit 28BYJ-48 + módulo ULN2003

**Datasheet:** sin enlace. Datasheet del chip ULN2003A del módulo; el motor 28BYJ-48 no tiene datasheet de fabricante publicado.

| Terminal | Función |
|---|---|
| IN1 | entrada 1 (bobina A) |
| IN2 | entrada 2 (bobina B) |
| IN3 | entrada 3 (bobina C) |
| IN4 | entrada 4 (bobina D) |
| - | tierra |
| + | 5–12 V |

### LCD 16x2 con módulo I2C

**Datasheet:** [Texas Instruments](https://www.ti.com/product/PCF8574)  
Datasheet del expansor PCF8574 del adaptador I²C; la pantalla usa el controlador HD44780 (ver «Pantalla LCD (bus paralelo)»).

| Terminal | Función |
|---|---|
| GND | tierra |
| VCC | +5 V |
| SDA | datos I2C |
| SCL | reloj I2C |

### LCD 20x4 con módulo I2C

**Datasheet:** [Texas Instruments](https://www.ti.com/product/PCF8574)  
Datasheet del expansor PCF8574 del adaptador I²C; la pantalla usa el controlador HD44780.

| Terminal | Función |
|---|---|
| GND | tierra |
| VCC | +5 V |
| SDA | datos I2C |
| SCL | reloj I2C |

### Motor DC tipo 130 (3–6 V)

**Datasheet:** sin enlace. Motor DC 130 genérico.

| Terminal | Función |
|---|---|
| + | terminal + |
| - | terminal − |

### Motorreductor TT 1:48 (3–6 V)

**Datasheet:** sin enlace. Motorreductor TT genérico.

| Terminal | Función |
|---|---|
| + | terminal + |
| - | terminal − |

### Paso a paso 28BYJ-48 (unipolar 5 V)

**Datasheet:** sin enlace. El 28BYJ-48 no tiene datasheet de fabricante publicado.

| Terminal | Función |
|---|---|
| A | bobina A (azul) |
| B | bobina B (rosa) |
| C | bobina C (amarillo) |
| D | bobina D (naranja) |
| COM | común (rojo) |

### Paso a paso NEMA 17 (bipolar 12 V)

**Datasheet:** sin enlace. NEMA 17 es un tamaño de brida, no un modelo: el datasheet depende del fabricante.

| Terminal | Función |
|---|---|
| A+ | bobina A+ (negro) |
| A- | bobina A− (verde) |
| B+ | bobina B+ (rojo) |
| B- | bobina B− (azul) |

### Servomotor SG90

**Datasheet:** sin enlace. El SG90 no tiene datasheet publicado por TowerPro.

| Terminal | Función |
|---|---|
| GND | tierra (cable negro) |
| VCC | +5 V (cable rojo) |
| SIG | señal PWM (cable amarillo) |

### Módulo ULN2003 para paso a paso

**Datasheet:** [Texas Instruments](https://www.ti.com/product/ULN2003A)  
Datasheet del chip ULN2003A que lleva el módulo.

| Terminal | Función |
|---|---|
| IN1 | entrada 1 |
| IN2 | entrada 2 |
| IN3 | entrada 3 |
| IN4 | entrada 4 |
| - | tierra del módulo |
| + | 5–12 V del motor |
| A | motor A (azul) |
| B | motor B (rosa) |
| C | motor C (amarillo) |
| D | motor D (naranja) |
| COM | motor común (rojo) |

### Módulo puente H L298N

**Datasheet:** [STMicroelectronics](https://www.st.com/resource/en/datasheet/l298.pdf)  
Datasheet del chip L298 que lleva el módulo; la placa (regulador 78M05, diodos y bornes) es un diseño genérico.

| Terminal | Función |
|---|---|
| IN1 |  |
| IN2 |  |
| IN3 |  |
| IN4 |  |
| ENA | habilita motor A (PWM) |
| ENB | habilita motor B (PWM) |
| OUT1 | motor A |
| OUT2 | motor A |
| OUT3 | motor B |
| OUT4 | motor B |
| 12V | alimentación del motor (5–35 V) |
| GND | tierra |
| 5V | 5 V (salida si el puente del regulador está puesto) |

### Arduino Uno R3

**Datasheet:** [Arduino](https://docs.arduino.cc/hardware/uno-rev3/)  
Página oficial del Arduino Uno Rev3, con esquema, pinout y datasheet del ATmega328P.

| Terminal | Función |
|---|---|
| D0 |  |
| D1 |  |
| D2 |  |
| D3 |  |
| D4 |  |
| D5 |  |
| D6 |  |
| D7 |  |
| D8 |  |
| D9 |  |
| D10 |  |
| D11 |  |
| D12 |  |
| D13 |  |
| A0 |  |
| A1 |  |
| A2 |  |
| A3 |  |
| A4 |  |
| A5 |  |
| 5V | salida 5 V |
| 3V3 | salida 3,3 V |
| GND | tierra |
| GND2 | tierra |
| GND3 | tierra |

### Sensor de línea TCRT5000 doble

**Datasheet:** [Vishay](https://www.vishay.com/docs/83760/tcrt5000.pdf)  
Cada canal del módulo es un TCRT5000; el comparador del módulo es un LM393.

| Terminal | Función |
|---|---|
| VCC | +5 V |
| GND | tierra |
| DO_L | salida digital izquierda (alto = ve la línea negra) |
| DO_R | salida digital derecha (alto = ve la línea negra) |
| AO_L | salida analógica izquierda |
| AO_R | salida analógica derecha |

### Sensor ultrasónico HC-SR04

**Datasheet:** sin enlace. El HC-SR04 se vende sin datasheet de fabricante verificable.

| Terminal | Función |
|---|---|
| VCC | +5 V |
| TRIG | disparo (pulso de 10 µs) |
| ECHO | eco (pulso de 58 µs por cm) |
| GND | tierra |

### IMU MPU6050 (giroscopio + acelerómetro)

**Datasheet:** [TDK InvenSense](https://invensense.tdk.com/products/motion-tracking/6-axis/mpu-6050/)  
Página de producto de TDK InvenSense, con el datasheet y el mapa de registros.

| Terminal | Función |
|---|---|
| VCC | +5 V (regulador en el módulo) |
| GND | tierra |
| SCL | reloj I2C |
| SDA | datos I2C (dirección 0x68) |

### Chasis 2WD modular (motores integrados)

**Datasheet:** sin enlace. Kit genérico.

| Terminal | Función |
|---|---|
| M_IZQ+ | motor izquierdo + |
| M_IZQ- | motor izquierdo − |
| M_DER+ | motor derecho + |
| M_DER- | motor derecho − |

### Chasis de auto-balanceo (motores integrados)

**Datasheet:** sin enlace. Kit genérico.

| Terminal | Función |
|---|---|
| M_IZQ+ | motor izquierdo + |
| M_IZQ- | motor izquierdo − |
| M_DER+ | motor derecho + |
| M_DER- | motor derecho − |

### Brazo robótico 4-DOF articulado (J1 base · J2 hombro · J3 codo · J4 pinza)

**Datasheet:** sin enlace. Kit genérico.

| Terminal | Función |
|---|---|
| GND | tierra de los 4 servos |
| VCC | +5 V de los 4 servos (fuente aparte) |
| S1 | señal PWM · J1 base |
| S2 | señal PWM · J2 hombro |
| S3 | señal PWM · J3 codo |
| S4 | señal PWM · J4 pinza |

### Portapilas AA con interruptor

**Datasheet:** sin enlace. Accesorio genérico.

| Terminal | Función |
|---|---|
| + | positivo de las pilas (cable rojo) |
| - | negativo (cable negro) |

### Batería / portapilas con interruptor (3–12 V)

**Datasheet:** sin enlace. Accesorio genérico.

| Terminal | Función |
|---|---|
| + | positivo (cable rojo) |
| - | negativo (cable negro) |

### Joystick analógico de 2 ejes (KY-023)

**Datasheet:** sin enlace. Módulo genérico KY-023 (dos potenciómetros y un pulsador).

| Terminal | Función |
|---|---|
| GND | tierra |
| +5V | alimentación de los potenciómetros |
| VRx | salida analógica del eje X |
| VRy | salida analógica del eje Y |
| SW | pulsador (a GND al presionar) |

### Módulo relé 5 V (SRD-05VDC)

**Datasheet:** sin enlace. Módulo genérico con relé Songle SRD-05VDC.

| Terminal | Función |
|---|---|
| VCC | +5 V de la bobina |
| GND | tierra |
| IN | entrada de control |
| COM | común del contacto |
| NO | normalmente abierto |
| NC | normalmente cerrado |

### Multímetro digital UNI-T UT53

**Datasheet:** sin enlace. Manual del fabricante no verificado.

| Terminal | Función |
|---|---|
| A | borne 10 A (corriente alta, shunt 0,01 Ω) |
| MA | borne mA (hasta 200 mA, shunt 1 Ω) |
| COM | común (punta negra) |
| VOHM | V Ω → (punta roja: voltaje, resistencia, diodo, continuidad y capacidad) |

### Punta lógica digital TESTECH EM4610

**Datasheet:** sin enlace. Manual del fabricante no verificado.

| Terminal | Función |
|---|---|
| TIP | punta de aguja: nodo que se analiza |
| VCC | caimán rojo: alimentación 4,5 a 18 V del circuito |
| GND | caimán negro: tierra del circuito |

### Teclado matricial 4×4

**Datasheet:** sin enlace. Teclado de membrana genérico.

| Terminal | Función |
|---|---|
| R1 | fila 1 (1 2 3 A) |
| R2 | fila 2 (4 5 6 B) |
| R3 | fila 3 (7 8 9 C) |
| R4 | fila 4 (* 0 # D) |
| C1 | columna 1 |
| C2 | columna 2 |
| C3 | columna 3 |
| C4 | columna 4 |

### Pantalla OLED 0,96" 128×64 I2C (SSD1306)

**Datasheet:** [Solomon Systech (copia de Adafruit)](https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf)  
Datasheet del controlador SSD1306; el enlace es la copia pública que aloja Adafruit.

| Terminal | Función |
|---|---|
| GND | tierra |
| VCC | 3,3 a 5 V |
| SCL | reloj I2C |
| SDA | datos I2C (dirección 0x3C) |

### Fuente de alimentación DC

**Datasheet:** sin enlace. Instrumento genérico del simulador.

| Terminal | Función |
|---|---|
| + | salida + |
| - | salida − |
| gnd | tierra |

### Generador de señales

**Datasheet:** sin enlace. Instrumento genérico del simulador.

| Terminal | Función |
|---|---|
| out | salida |
| gnd | tierra |

### Transformador 120 V → 12-0-12 V con toma central

**Datasheet:** sin enlace. Transformador genérico.

| Terminal | Función |
|---|---|
| A | secundario, extremo A |
| CT | toma central (0 V) |
| B | secundario, extremo B |

### Osciloscopio Rigol DS1054Z (4 canales)

**Datasheet:** [Rigol](https://www.rigolna.com/products/digital-oscilloscopes/1000z/)

| Terminal | Función |
|---|---|
| ch1 | canal 1 (BNC) |
| ch2 | canal 2 (BNC) |
| ch3 | canal 3 (BNC) |
| ch4 | canal 4 (BNC) |
| gnd | tierra de las puntas |

### Osciloscopio de 2 canales

**Datasheet:** sin enlace. Instrumento genérico del simulador.

| Terminal | Función |
|---|---|
| ch1 | canal 1 |
| ch2 | canal 2 |
| gnd | tierra |
