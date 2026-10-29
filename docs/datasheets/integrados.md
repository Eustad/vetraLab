# Integrados

Una ficha por circuito integrado DIP del simulador.

> Las patas y los rangos de esta ficha son los que usa VectraLab 24 al simular. Para diseñar un circuito real manda siempre el datasheet del fabricante.

## Controladores

### L293D · Doble puente H

Cuatro medios puentes H para motores DC y paso a paso bipolares. VCC1 (16) es la lógica a 5 V; VCC2 (8) es el voltaje del motor. EN en alto habilita cada par.

- Encapsulado: DIP-16 (marcado L293DNE)
- Alimentación: pata 16 (VCC1) y pata 4 (GND), de lógica 4,5 a 7 V, motor hasta 36 V; el simulador lo da por dañado sobre 7,5 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/L293D)

| Pata | Nombre |
|---:|---|
| 1 | EN1,2 |
| 2 | 1A |
| 3 | 1Y |
| 4 | GND |
| 5 | GND |
| 6 | 2Y |
| 7 | 2A |
| 8 | VCC2 |
| 9 | EN3,4 |
| 10 | 3A |
| 11 | 3Y |
| 12 | GND |
| 13 | GND |
| 14 | 4Y |
| 15 | 4A |
| 16 | VCC1 |

### ULN2003 · 7 × Darlington

Siete Darlington de colector abierto: con la entrada en alto, la salida conecta la carga a GND. Ideal para el paso a paso 28BYJ-48 y relés. COM va al positivo del motor.

- Encapsulado: DIP-16 (marcado ULN2003AN)
- Alimentación: pata 9 (COM) y pata 8 (GND), de hasta 50 V en las salidas; el simulador lo da por dañado sobre 55 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/ULN2003A)

| Pata | Nombre |
|---:|---|
| 1 | 1B |
| 2 | 2B |
| 3 | 3B |
| 4 | 4B |
| 5 | 5B |
| 6 | 6B |
| 7 | 7B |
| 8 | GND |
| 9 | COM |
| 10 | 7C |
| 11 | 6C |
| 12 | 5C |
| 13 | 4C |
| 14 | 3C |
| 15 | 2C |
| 16 | 1C |

## Analógicos

### LM324 · 4 × op-amp

Cuatro amplificadores operacionales. Con fuente dual: VCC (4) a +V y GND (11) a −V. La salida llega a 1,5 V del positivo y casi al negativo.

- Encapsulado: DIP-14 (marcado LM324N)
- Alimentación: pata 4 (VCC) y pata 11 (GND), de 3 a 32 V; el simulador lo da por dañado sobre 34 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/LM324)

| Pata | Nombre |
|---:|---|
| 1 | OUT 1 |
| 2 | IN− 1 |
| 3 | IN+ 1 |
| 4 | VCC |
| 5 | IN+ 2 |
| 6 | IN− 2 |
| 7 | OUT 2 |
| 8 | OUT 3 |
| 9 | IN− 3 |
| 10 | IN+ 3 |
| 11 | GND |
| 12 | IN+ 4 |
| 13 | IN− 4 |
| 14 | OUT 4 |

### LM358 · 2 × op-amp

Doble amplificador operacional de fuente simple; la salida llega casi a 0 V.

- Encapsulado: DIP-8 (marcado LM358N)
- Alimentación: pata 8 (VCC) y pata 4 (GND), de 3 a 32 V; el simulador lo da por dañado sobre 34 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/LM358)

| Pata | Nombre |
|---:|---|
| 1 | OUT A |
| 2 | IN− A |
| 3 | IN+ A |
| 4 | GND |
| 5 | IN+ B |
| 6 | IN− B |
| 7 | OUT B |
| 8 | VCC |

### NE555 · Temporizador

Temporizador clásico: astable, monoestable y PWM. RESET con pull-up interno.

- Encapsulado: DIP-8 (marcado NE555P)
- Alimentación: pata 8 (VCC) y pata 1 (GND), de 4,5 a 16 V; el simulador lo da por dañado sobre 18 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/NE555)

| Pata | Nombre |
|---:|---|
| 1 | GND |
| 2 | TRIG |
| 3 | OUT |
| 4 | RESET |
| 5 | CTRL |
| 6 | THR |
| 7 | DIS |
| 8 | VCC |

### NE556 · Doble temporizador

Dos 555 independientes en un solo chip (comparten alimentación).

- Encapsulado: DIP-14 (marcado NE556N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 4,5 a 16 V; el simulador lo da por dañado sobre 18 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/NE556)

| Pata | Nombre |
|---:|---|
| 1 | DIS 1 |
| 2 | THR 1 |
| 3 | CTRL 1 |
| 4 | RESET 1 |
| 5 | OUT 1 |
| 6 | TRIG 1 |
| 7 | GND |
| 8 | TRIG 2 |
| 9 | OUT 2 |
| 10 | RESET 2 |
| 11 | CTRL 2 |
| 12 | THR 2 |
| 13 | DIS 2 |
| 14 | VCC |

### LM741 · Op-amp

Amplificador operacional de propósito general. Su salida queda 1,5 V lejos de cada riel.

- Encapsulado: DIP-8 (marcado LM741CN)
- Alimentación: pata 7 (V+) y pata 4 (V−), de 10 a 36 V; el simulador lo da por dañado sobre 38 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/LM741)

| Pata | Nombre |
|---:|---|
| 1 | NULL |
| 2 | IN− |
| 3 | IN+ |
| 4 | V− |
| 5 | NULL |
| 6 | OUT |
| 7 | V+ |
| 8 | NC |

### TL081 · Op-amp JFET

Amplificador operacional con entrada JFET (corriente de entrada casi nula). Mismo pinout que el 741.

- Encapsulado: DIP-8 (marcado TL081CP)
- Alimentación: pata 7 (V+) y pata 4 (V−), de ±3,5 a ±18 V; el simulador lo da por dañado sobre 38 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/TL081)

| Pata | Nombre |
|---:|---|
| 1 | NULL |
| 2 | IN− |
| 3 | IN+ |
| 4 | V− |
| 5 | NULL |
| 6 | OUT |
| 7 | V+ |
| 8 | NC |

### TL082 · 2 × op-amp JFET

Doble op-amp JFET; mismo pinout que el LM358 pero necesita fuente dual (±).

- Encapsulado: DIP-8 (marcado TL082CP)
- Alimentación: pata 8 (V+) y pata 4 (V−), de ±3,5 a ±18 V; el simulador lo da por dañado sobre 38 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/TL082)

| Pata | Nombre |
|---:|---|
| 1 | OUT A |
| 2 | IN− A |
| 3 | IN+ A |
| 4 | V− |
| 5 | IN+ B |
| 6 | IN− B |
| 7 | OUT B |
| 8 | V+ |

### TL084 · 4 × op-amp JFET

Cuádruple op-amp JFET; mismo pinout que el LM324.

- Encapsulado: DIP-14 (marcado TL084CN)
- Alimentación: pata 4 (V+) y pata 11 (V−), de ±3,5 a ±18 V; el simulador lo da por dañado sobre 38 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/TL084)

| Pata | Nombre |
|---:|---|
| 1 | OUT 1 |
| 2 | IN− 1 |
| 3 | IN+ 1 |
| 4 | V+ |
| 5 | IN+ 2 |
| 6 | IN− 2 |
| 7 | OUT 2 |
| 8 | OUT 3 |
| 9 | IN− 3 |
| 10 | IN+ 3 |
| 11 | V− |
| 12 | IN+ 4 |
| 13 | IN− 4 |
| 14 | OUT 4 |

### LM386 · Amplificador de audio

Amplificador de potencia de audio con ganancia interna de 20: la salida queda en Vs/2 y amplifica (IN+ − IN−). Con 10 µF entre GAIN (1-8) la ganancia sube a 200.

- Encapsulado: DIP-8 (marcado LM386N-1)
- Alimentación: pata 6 (VS) y pata 4 (GND), de 4 a 12 V; el simulador lo da por dañado sobre 15 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/LM386)

| Pata | Nombre |
|---:|---|
| 1 | GAIN |
| 2 | IN− |
| 3 | IN+ |
| 4 | GND |
| 5 | VOUT |
| 6 | VS |
| 7 | BYPASS |
| 8 | GAIN |

## CMOS 4000

### CD4001 · 4 × NOR CMOS

Cuatro NOR CMOS de 3 a 18 V.

- Encapsulado: DIP-14 (marcado CD4001BE)
- Alimentación: pata 14 (VDD) y pata 7 (VSS), de 3 a 18 V; el simulador lo da por dañado sobre 20 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD4001B)

| Pata | Nombre |
|---:|---|
| 1 | A |
| 2 | B |
| 3 | J |
| 4 | K |
| 5 | C |
| 6 | D |
| 7 | VSS |
| 8 | E |
| 9 | F |
| 10 | L |
| 11 | M |
| 12 | G |
| 13 | H |
| 14 | VDD |

### CD4011 · 4 × NAND CMOS

Cuatro NAND CMOS de 3 a 18 V. Pinout CD4000: no es igual al 74HC00.

- Encapsulado: DIP-14 (marcado CD4011BE)
- Alimentación: pata 14 (VDD) y pata 7 (VSS), de 3 a 18 V; el simulador lo da por dañado sobre 20 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD4011B)

| Pata | Nombre |
|---:|---|
| 1 | A |
| 2 | B |
| 3 | J |
| 4 | K |
| 5 | C |
| 6 | D |
| 7 | VSS |
| 8 | E |
| 9 | F |
| 10 | L |
| 11 | M |
| 12 | G |
| 13 | H |
| 14 | VDD |

### CD4013 · 2 × flip-flop D

Dos flip-flops D CMOS con SET y RESET activos en ALTO (al revés que el 74HC74).

- Encapsulado: DIP-14 (marcado CD4013BE)
- Alimentación: pata 14 (VDD) y pata 7 (VSS), de 3 a 18 V; el simulador lo da por dañado sobre 20 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD4013B)

| Pata | Nombre |
|---:|---|
| 1 | Q1 |
| 2 | /Q1 |
| 3 | CLK1 |
| 4 | RST1 |
| 5 | D1 |
| 6 | SET1 |
| 7 | VSS |
| 8 | SET2 |
| 9 | D2 |
| 10 | RST2 |
| 11 | CLK2 |
| 12 | /Q2 |
| 13 | Q2 |
| 14 | VDD |

### CD4026 · Contador + driver 7 seg

Contador de décadas con salidas directas para un display de cátodo común. DEI en alto muestra los segmentos (pull-up incluido aquí por comodidad); CO divide por 10.

- Encapsulado: DIP-16 (marcado CD4026BE)
- Alimentación: pata 16 (VDD) y pata 8 (VSS), de 3 a 18 V; el simulador lo da por dañado sobre 20 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD4026B)

| Pata | Nombre |
|---:|---|
| 1 | CLK |
| 2 | CLK INH |
| 3 | DEI |
| 4 | DEO |
| 5 | CO |
| 6 | f |
| 7 | g |
| 8 | VSS |
| 9 | d |
| 10 | a |
| 11 | e |
| 12 | b |
| 13 | c |
| 14 | UNG C |
| 15 | RST |
| 16 | VDD |

### CD4051 · Mux analógico 8 → 1

Interruptor analógico bidireccional: une X (pin 3) con el canal X0–X7 elegido por A, B, C (≈ 125 Ω). /INH en alto abre todo. Las señales deben quedar entre VEE y VDD.

- Encapsulado: DIP-16 (marcado CD4051BE)
- Alimentación: pata 16 (VDD) y pata 8 (VSS), de 3 a 18 V; el simulador lo da por dañado sobre 20 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD4051B)

| Pata | Nombre |
|---:|---|
| 1 | X4 |
| 2 | X6 |
| 3 | X |
| 4 | X7 |
| 5 | X5 |
| 6 | /INH |
| 7 | VEE |
| 8 | VSS |
| 9 | C |
| 10 | B |
| 11 | A |
| 12 | X3 |
| 13 | X0 |
| 14 | X1 |
| 15 | X2 |
| 16 | VDD |

### CD4069 · 6 × NOT CMOS

Seis inversores CMOS de 3 a 18 V.

- Encapsulado: DIP-14 (marcado CD4069UBE)
- Alimentación: pata 14 (VDD) y pata 7 (VSS), de 3 a 18 V; el simulador lo da por dañado sobre 20 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD4069UB)

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1Y |
| 3 | 2A |
| 4 | 2Y |
| 5 | 3A |
| 6 | 3Y |
| 7 | VSS |
| 8 | 4Y |
| 9 | 4A |
| 10 | 5Y |
| 11 | 5A |
| 12 | 6Y |
| 13 | 6A |
| 14 | VDD |

### CD4070 · 4 × XOR CMOS

Cuatro XOR CMOS de 3 a 18 V.

- Encapsulado: DIP-14 (marcado CD4070BE)
- Alimentación: pata 14 (VDD) y pata 7 (VSS), de 3 a 18 V; el simulador lo da por dañado sobre 20 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD4070B)

| Pata | Nombre |
|---:|---|
| 1 | A |
| 2 | B |
| 3 | J |
| 4 | K |
| 5 | C |
| 6 | D |
| 7 | VSS |
| 8 | E |
| 9 | F |
| 10 | L |
| 11 | M |
| 12 | G |
| 13 | H |
| 14 | VDD |

### CD4071 · 4 × OR CMOS

Cuatro OR CMOS de 3 a 18 V.

- Encapsulado: DIP-14 (marcado CD4071BE)
- Alimentación: pata 14 (VDD) y pata 7 (VSS), de 3 a 18 V; el simulador lo da por dañado sobre 20 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD4071B)

| Pata | Nombre |
|---:|---|
| 1 | A |
| 2 | B |
| 3 | J |
| 4 | K |
| 5 | C |
| 6 | D |
| 7 | VSS |
| 8 | E |
| 9 | F |
| 10 | L |
| 11 | M |
| 12 | G |
| 13 | H |
| 14 | VDD |

### CD4081 · 4 × AND CMOS

Cuatro AND CMOS de 3 a 18 V.

- Encapsulado: DIP-14 (marcado CD4081BE)
- Alimentación: pata 14 (VDD) y pata 7 (VSS), de 3 a 18 V; el simulador lo da por dañado sobre 20 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD4081B)

| Pata | Nombre |
|---:|---|
| 1 | A |
| 2 | B |
| 3 | J |
| 4 | K |
| 5 | C |
| 6 | D |
| 7 | VSS |
| 8 | E |
| 9 | F |
| 10 | L |
| 11 | M |
| 12 | G |
| 13 | H |
| 14 | VDD |

### CD4093 · 4 × NAND Schmitt

Cuatro NAND CMOS con disparador Schmitt: ideal para osciladores RC y limpiar pulsadores.

- Encapsulado: DIP-14 (marcado CD4093BE)
- Alimentación: pata 14 (VDD) y pata 7 (VSS), de 3 a 18 V; el simulador lo da por dañado sobre 20 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD4093B)

| Pata | Nombre |
|---:|---|
| 1 | A |
| 2 | B |
| 3 | J |
| 4 | K |
| 5 | C |
| 6 | D |
| 7 | VSS |
| 8 | E |
| 9 | F |
| 10 | L |
| 11 | M |
| 12 | G |
| 13 | H |
| 14 | VDD |

### CD4511 · Latch BCD → 7 seg

Decodificador BCD a 7 segmentos con latch y salidas de alta corriente para cátodo común. /LT en bajo prueba todos los segmentos; /BL en bajo apaga; LE en alto congela el número.

- Encapsulado: DIP-16 (marcado CD4511BE)
- Alimentación: pata 16 (VDD) y pata 8 (VSS), de 3 a 18 V; el simulador lo da por dañado sobre 20 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD4511B)

| Pata | Nombre |
|---:|---|
| 1 | B |
| 2 | C |
| 3 | /LT |
| 4 | /BL |
| 5 | LE |
| 6 | D |
| 7 | A |
| 8 | VSS |
| 9 | e |
| 10 | d |
| 11 | c |
| 12 | b |
| 13 | a |
| 14 | g |
| 15 | f |
| 16 | VDD |

## Secuenciales

### CD4017 · Contador decimal

Contador Johnson de 10 salidas. Avanza en cada flanco de subida de CLK.

- Encapsulado: DIP-16 (marcado CD4017BE)
- Alimentación: pata 16 (VDD) y pata 8 (VSS), de 3 a 18 V; el simulador lo da por dañado sobre 20 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD4017B)

| Pata | Nombre |
|---:|---|
| 1 | Q5 |
| 2 | Q1 |
| 3 | Q0 |
| 4 | Q2 |
| 5 | Q6 |
| 6 | Q7 |
| 7 | Q3 |
| 8 | VSS |
| 9 | Q8 |
| 10 | Q4 |
| 11 | Q9 |
| 12 | CO |
| 13 | INH |
| 14 | CLK |
| 15 | RST |
| 16 | VDD |

### 74HC73 · 2 × flip-flop JK

Dos flip-flops JK con clear activo en bajo. Cambian en el flanco de BAJADA del reloj: J=K=1 alterna (divide por 2).

- Encapsulado: DIP-14 (marcado SN74HC73N)
- Alimentación: pata 4 (VCC) y pata 11 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD74HC73)  
TI fabrica esta función como CD74HC73.

| Pata | Nombre |
|---:|---|
| 1 | 1CLK |
| 2 | /1CLR |
| 3 | 1K |
| 4 | VCC |
| 5 | 2CLK |
| 6 | /2CLR |
| 7 | 2J |
| 8 | /2Q |
| 9 | 2Q |
| 10 | 2K |
| 11 | GND |
| 12 | 1Q |
| 13 | /1Q |
| 14 | 1J |

### 74HC74 · 2 × flip-flop D

Dos flip-flops tipo D con preset y clear (activos en bajo, con pull-up interno).

- Encapsulado: DIP-14 (marcado SN74HC74N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC74)

| Pata | Nombre |
|---:|---|
| 1 | /1CLR |
| 2 | 1D |
| 3 | 1CLK |
| 4 | /1PRE |
| 5 | 1Q |
| 6 | /1Q |
| 7 | GND |
| 8 | /2Q |
| 9 | 2Q |
| 10 | /2PRE |
| 11 | 2CLK |
| 12 | 2D |
| 13 | /2CLR |
| 14 | VCC |

### 74HC76 · 2 × JK con preset

Dos flip-flops JK con preset y clear (activos en bajo). Flanco de bajada.

- Encapsulado: DIP-16 (marcado SN74HC76N)
- Alimentación: pata 5 (VCC) y pata 13 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** sin enlace. El 74HC76 está descontinuado y ningún fabricante actual lo publica; el 74HC73 (CD74HC73) es la alternativa más cercana.

| Pata | Nombre |
|---:|---|
| 1 | 1CLK |
| 2 | /1PRE |
| 3 | /1CLR |
| 4 | 1J |
| 5 | VCC |
| 6 | 2CLK |
| 7 | /2PRE |
| 8 | /2CLR |
| 9 | 2J |
| 10 | /2Q |
| 11 | 2Q |
| 12 | 2K |
| 13 | GND |
| 14 | /1Q |
| 15 | 1Q |
| 16 | 1K |

### 74HC164 · Registro serie-paralelo

Registro de desplazamiento de 8 bits: el dato serie es A·B y entra en cada flanco de subida de CLK. /CLR en bajo borra (pull-up interno).

- Encapsulado: DIP-14 (marcado SN74HC164N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC164)

| Pata | Nombre |
|---:|---|
| 1 | A |
| 2 | B |
| 3 | QA |
| 4 | QB |
| 5 | QC |
| 6 | QD |
| 7 | GND |
| 8 | CLK |
| 9 | /CLR |
| 10 | QE |
| 11 | QF |
| 12 | QG |
| 13 | QH |
| 14 | VCC |

### 74HC595 · Registro 8 bits

Registro de desplazamiento serie a paralelo con latch. /SRCLR con pull-up interno.

- Encapsulado: DIP-16 (marcado SN74HC595N)
- Alimentación: pata 16 (VCC) y pata 8 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC595)

| Pata | Nombre |
|---:|---|
| 1 | QB |
| 2 | QC |
| 3 | QD |
| 4 | QE |
| 5 | QF |
| 6 | QG |
| 7 | QH |
| 8 | GND |
| 9 | QH' |
| 10 | /SRCLR |
| 11 | SRCLK |
| 12 | RCLK |
| 13 | /OE |
| 14 | SER |
| 15 | QA |
| 16 | VCC |

## Compuertas lógicas

### 74HC7266 · 4 × XNOR

Cuatro compuertas XNOR: la salida es 1 cuando las dos entradas son iguales.

- Encapsulado: DIP-14 (marcado SN74HC7266N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD74HC7266)  
TI fabrica esta función como CD74HC7266.

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1B |
| 3 | 1Y |
| 4 | 2Y |
| 5 | 2A |
| 6 | 2B |
| 7 | GND |
| 8 | 3A |
| 9 | 3B |
| 10 | 3Y |
| 11 | 4Y |
| 12 | 4A |
| 13 | 4B |
| 14 | VCC |

### 74HC00 · 4 × NAND

Cuatro compuertas NAND de dos entradas.

- Encapsulado: DIP-14 (marcado SN74HC00N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC00)

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1B |
| 3 | 1Y |
| 4 | 2A |
| 5 | 2B |
| 6 | 2Y |
| 7 | GND |
| 8 | 3Y |
| 9 | 3A |
| 10 | 3B |
| 11 | 4Y |
| 12 | 4A |
| 13 | 4B |
| 14 | VCC |

### 74HC02 · 4 × NOR

Cuatro compuertas NOR de dos entradas. Ojo: las salidas están en los pines 1, 4, 10 y 13.

- Encapsulado: DIP-14 (marcado SN74HC02N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC02)

| Pata | Nombre |
|---:|---|
| 1 | 1Y |
| 2 | 1A |
| 3 | 1B |
| 4 | 2Y |
| 5 | 2A |
| 6 | 2B |
| 7 | GND |
| 8 | 3A |
| 9 | 3B |
| 10 | 3Y |
| 11 | 4A |
| 12 | 4B |
| 13 | 4Y |
| 14 | VCC |

### 74HC04 · 6 × NOT

Seis inversores.

- Encapsulado: DIP-14 (marcado SN74HC04N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC04)

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1Y |
| 3 | 2A |
| 4 | 2Y |
| 5 | 3A |
| 6 | 3Y |
| 7 | GND |
| 8 | 4Y |
| 9 | 4A |
| 10 | 5Y |
| 11 | 5A |
| 12 | 6Y |
| 13 | 6A |
| 14 | VCC |

### 74HC08 · 4 × AND

Cuatro compuertas AND de dos entradas.

- Encapsulado: DIP-14 (marcado SN74HC08N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC08)

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1B |
| 3 | 1Y |
| 4 | 2A |
| 5 | 2B |
| 6 | 2Y |
| 7 | GND |
| 8 | 3Y |
| 9 | 3A |
| 10 | 3B |
| 11 | 4Y |
| 12 | 4A |
| 13 | 4B |
| 14 | VCC |

### 74HC10 · 3 × NAND de 3 entradas

Tres compuertas NAND de tres entradas.

- Encapsulado: DIP-14 (marcado SN74HC10N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC10)

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1B |
| 3 | 2A |
| 4 | 2B |
| 5 | 2C |
| 6 | 2Y |
| 7 | GND |
| 8 | 3Y |
| 9 | 3A |
| 10 | 3B |
| 11 | 3C |
| 12 | 1Y |
| 13 | 1C |
| 14 | VCC |

### 74HC11 · 3 × AND de 3 entradas

Tres compuertas AND de tres entradas.

- Encapsulado: DIP-14 (marcado SN74HC11N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC11)

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1B |
| 3 | 2A |
| 4 | 2B |
| 5 | 2C |
| 6 | 2Y |
| 7 | GND |
| 8 | 3Y |
| 9 | 3A |
| 10 | 3B |
| 11 | 3C |
| 12 | 1Y |
| 13 | 1C |
| 14 | VCC |

### 74HC14 · 6 × NOT Schmitt

Seis inversores con disparador Schmitt (histéresis amplia).

- Encapsulado: DIP-14 (marcado SN74HC14N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC14)

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1Y |
| 3 | 2A |
| 4 | 2Y |
| 5 | 3A |
| 6 | 3Y |
| 7 | GND |
| 8 | 4Y |
| 9 | 4A |
| 10 | 5Y |
| 11 | 5A |
| 12 | 6Y |
| 13 | 6A |
| 14 | VCC |

### 74HC20 · 2 × NAND de 4 entradas

Dos compuertas NAND de cuatro entradas.

- Encapsulado: DIP-14 (marcado SN74HC20N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC20)

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1B |
| 3 | NC |
| 4 | 1C |
| 5 | 1D |
| 6 | 1Y |
| 7 | GND |
| 8 | 2Y |
| 9 | 2A |
| 10 | 2B |
| 11 | NC |
| 12 | 2C |
| 13 | 2D |
| 14 | VCC |

### 74HC32 · 4 × OR

Cuatro compuertas OR de dos entradas.

- Encapsulado: DIP-14 (marcado SN74HC32N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC32)

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1B |
| 3 | 1Y |
| 4 | 2A |
| 5 | 2B |
| 6 | 2Y |
| 7 | GND |
| 8 | 3Y |
| 9 | 3A |
| 10 | 3B |
| 11 | 4Y |
| 12 | 4A |
| 13 | 4B |
| 14 | VCC |

### 74HC86 · 4 × XOR

Cuatro compuertas OR exclusiva de dos entradas.

- Encapsulado: DIP-14 (marcado SN74HC86N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC86)

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1B |
| 3 | 1Y |
| 4 | 2A |
| 5 | 2B |
| 6 | 2Y |
| 7 | GND |
| 8 | 3Y |
| 9 | 3A |
| 10 | 3B |
| 11 | 4Y |
| 12 | 4A |
| 13 | 4B |
| 14 | VCC |

## Decodificadores y contadores

### 74LS47 · BCD → 7 seg (ánodo común)

Decodificador BCD a 7 segmentos con salidas de colector abierto activas en bajo: maneja un display de ÁNODO común con un resistor por segmento.

- Encapsulado: DIP-16 (marcado SN74LS47N)
- Alimentación: pata 16 (VCC) y pata 8 (GND), de 4,75 a 5,25 V (TTL); el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74LS47)

| Pata | Nombre |
|---:|---|
| 1 | B |
| 2 | C |
| 3 | /LT |
| 4 | /BI-RBO |
| 5 | /RBI |
| 6 | D |
| 7 | A |
| 8 | GND |
| 9 | e |
| 10 | d |
| 11 | c |
| 12 | b |
| 13 | a |
| 14 | g |
| 15 | f |
| 16 | VCC |

### 74LS48 · BCD → 7 seg (cátodo común)

Decodificador BCD a 7 segmentos con salidas activas en alto (pull-up interno de 2 kΩ): display de CÁTODO común.

- Encapsulado: DIP-16 (marcado SN74LS48N)
- Alimentación: pata 16 (VCC) y pata 8 (GND), de 4,75 a 5,25 V (TTL); el simulador lo da por dañado sobre 7 V

**Datasheet:** sin enlace. El 74LS48 está descontinuado; el SN74LS47 (ánodo común) tiene la misma lógica con salidas de colector abierto.

| Pata | Nombre |
|---:|---|
| 1 | B |
| 2 | C |
| 3 | /LT |
| 4 | /BI-RBO |
| 5 | /RBI |
| 6 | D |
| 7 | A |
| 8 | GND |
| 9 | e |
| 10 | d |
| 11 | c |
| 12 | b |
| 13 | a |
| 14 | g |
| 15 | f |
| 16 | VCC |

### 74HC138 · Decodificador 3 → 8

Activa (en bajo) una de 8 salidas según A, B, C. Habilitado con G1 en alto y /G2A, /G2B en bajo.

- Encapsulado: DIP-16 (marcado SN74HC138N)
- Alimentación: pata 16 (VCC) y pata 8 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC138)

| Pata | Nombre |
|---:|---|
| 1 | A |
| 2 | B |
| 3 | C |
| 4 | /G2A |
| 5 | /G2B |
| 6 | G1 |
| 7 | /Y7 |
| 8 | GND |
| 9 | /Y6 |
| 10 | /Y5 |
| 11 | /Y4 |
| 12 | /Y3 |
| 13 | /Y2 |
| 14 | /Y1 |
| 15 | /Y0 |
| 16 | VCC |

### 74HC151 · Multiplexor 8 → 1

Envía a Y la entrada D0–D7 elegida por A, B, C; /W es la salida invertida. /G en bajo habilita.

- Encapsulado: DIP-16 (marcado SN74HC151N)
- Alimentación: pata 16 (VCC) y pata 8 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC151)

| Pata | Nombre |
|---:|---|
| 1 | D3 |
| 2 | D2 |
| 3 | D1 |
| 4 | D0 |
| 5 | Y |
| 6 | /W |
| 7 | /G |
| 8 | GND |
| 9 | C |
| 10 | B |
| 11 | A |
| 12 | D7 |
| 13 | D6 |
| 14 | D5 |
| 15 | D4 |
| 16 | VCC |

### 74HC190 · Contador década ↑↓

Contador BCD síncrono ascendente/descendente: D/U en bajo cuenta hacia arriba, /CTEN en bajo habilita, /LOAD en bajo carga A–D.

- Encapsulado: DIP-16 (marcado SN74HC190N)
- Alimentación: pata 16 (VCC) y pata 8 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD74HC190)  
TI fabrica esta función como CD74HC190.

| Pata | Nombre |
|---:|---|
| 1 | B |
| 2 | QB |
| 3 | QA |
| 4 | /CTEN |
| 5 | D/U |
| 6 | QC |
| 7 | QD |
| 8 | GND |
| 9 | D |
| 10 | C |
| 11 | /LOAD |
| 12 | MAX/MIN |
| 13 | /RCO |
| 14 | CLK |
| 15 | A |
| 16 | VCC |

### 74HC193 · Contador binario ↑↓

Contador de 4 bits con relojes separados: flanco de subida en UP suma, en DOWN resta (el otro en alto). CLR en alto borra; /LOAD en bajo carga A–D.

- Encapsulado: DIP-16 (marcado SN74HC193N)
- Alimentación: pata 16 (VCC) y pata 8 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74HC193)

| Pata | Nombre |
|---:|---|
| 1 | B |
| 2 | QB |
| 3 | QA |
| 4 | DOWN |
| 5 | UP |
| 6 | QC |
| 7 | QD |
| 8 | GND |
| 9 | D |
| 10 | C |
| 11 | /LOAD |
| 12 | /CO |
| 13 | /BO |
| 14 | CLR |
| 15 | A |
| 16 | VCC |

### 74HC283 · Sumador de 4 bits

Suma A + B + C0 en binario de 4 bits: S1–S4 y acarreo C4.

- Encapsulado: DIP-16 (marcado SN74HC283N)
- Alimentación: pata 16 (VCC) y pata 8 (GND), de 2 a 6 V; el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/CD74HC283)  
TI fabrica esta función en HC como CD74HC283.

| Pata | Nombre |
|---:|---|
| 1 | S2 |
| 2 | B2 |
| 3 | A2 |
| 4 | S1 |
| 5 | A1 |
| 6 | B1 |
| 7 | C0 |
| 8 | GND |
| 9 | C4 |
| 10 | S4 |
| 11 | B4 |
| 12 | A4 |
| 13 | S3 |
| 14 | A3 |
| 15 | B3 |
| 16 | VCC |

## Conversores

### ADC0804 · ADC de 8 bits

Conversor analógico a digital de 8 bits por aproximaciones sucesivas. /CS y /RD a tierra; cada flanco de subida en /WR inicia una conversión (unos 100 µs) y al terminar /INTR baja. Une /WR con /INTR para que convierta solo. VREF/2 abierto equivale a VCC/2.

- Encapsulado: DIP-20 (marcado ADC0804LCN)
- Alimentación: pata 20 (VCC) y pata 10 (DGND), de 4,5 a 6,3 V (5 V típico); el simulador lo da por dañado sobre 6,5 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/ADC0804-N)  
TI lo publica como ADC0804-N.

| Pata | Nombre |
|---:|---|
| 1 | /CS |
| 2 | /RD |
| 3 | /WR |
| 4 | CLK IN |
| 5 | /INTR |
| 6 | VIN+ |
| 7 | VIN− |
| 8 | AGND |
| 9 | VREF/2 |
| 10 | DGND |
| 11 | DB7 |
| 12 | DB6 |
| 13 | DB5 |
| 14 | DB4 |
| 15 | DB3 |
| 16 | DB2 |
| 17 | DB1 |
| 18 | DB0 |
| 19 | CLK R |
| 20 | VCC |

### DAC0808 · DAC de 8 bits

Conversor digital a analógico de 8 bits con salida de corriente. VREF+ (14) recibe la corriente de referencia por un resistor; IO (4) absorbe Iref·(A1/2 + … + A8/256). Se convierte a voltaje con un op-amp. A1 es el bit más significativo. VEE (3) a −12/−15 V.

- Encapsulado: DIP-16 (marcado DAC0808LCN)
- Alimentación: pata 13 (VCC) y pata 2 (GND), de VCC de 4,5 a 18 V y VEE de −5 a −15 V; el simulador lo da por dañado sobre 18,5 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/DAC0808)

| Pata | Nombre |
|---:|---|
| 1 | NC |
| 2 | GND |
| 3 | VEE |
| 4 | IO |
| 5 | A1 |
| 6 | A2 |
| 7 | A3 |
| 8 | A4 |
| 9 | A5 |
| 10 | A6 |
| 11 | A7 |
| 12 | A8 |
| 13 | VCC |
| 14 | VREF+ |
| 15 | VREF− |
| 16 | COMP |

## Potencia

### TL494 · Controlador PWM

Controlador PWM para fuentes conmutadas. f = 1,1 / (RT·CT). La salida conduce mientras la rampa de CT supera al voltaje de FEEDBACK (3) y al de DTC (4). Dos amplificadores de error (1/2 y 16/15) con salida a FEEDBACK. REF (14) entrega 5 V. OUTPUT CTRL (13) a tierra: salidas en paralelo; a REF: push-pull.

- Encapsulado: DIP-16 (marcado TL494CN)
- Alimentación: pata 12 (VCC) y pata 7 (GND), de 7 a 40 V; el simulador lo da por dañado sobre 42 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/TL494)

| Pata | Nombre |
|---:|---|
| 1 | 1IN+ |
| 2 | 1IN− |
| 3 | FEEDBACK |
| 4 | DTC |
| 5 | CT |
| 6 | RT |
| 7 | GND |
| 8 | C1 |
| 9 | E1 |
| 10 | E2 |
| 11 | C2 |
| 12 | VCC |
| 13 | OUT CTRL |
| 14 | REF |
| 15 | 2IN− |
| 16 | 2IN+ |

## TTL 74LS

### 74LS00 · 4 × NAND TTL

Versión TTL bipolar del 7400: 5 V ± 5 %; una entrada al aire se lee como 1.

- Encapsulado: DIP-14 (marcado SN74LS00N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 4,75 a 5,25 V (TTL); el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74LS00)

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1B |
| 3 | 1Y |
| 4 | 2A |
| 5 | 2B |
| 6 | 2Y |
| 7 | GND |
| 8 | 3Y |
| 9 | 3A |
| 10 | 3B |
| 11 | 4Y |
| 12 | 4A |
| 13 | 4B |
| 14 | VCC |

### 74LS02 · 4 × NOR TTL

Versión TTL del 7402.

- Encapsulado: DIP-14 (marcado SN74LS02N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 4,75 a 5,25 V (TTL); el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74LS02)

| Pata | Nombre |
|---:|---|
| 1 | 1Y |
| 2 | 1A |
| 3 | 1B |
| 4 | 2Y |
| 5 | 2A |
| 6 | 2B |
| 7 | GND |
| 8 | 3A |
| 9 | 3B |
| 10 | 3Y |
| 11 | 4A |
| 12 | 4B |
| 13 | 4Y |
| 14 | VCC |

### 74LS04 · 6 × NOT TTL

Seis inversores TTL.

- Encapsulado: DIP-14 (marcado SN74LS04N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 4,75 a 5,25 V (TTL); el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74LS04)

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1Y |
| 3 | 2A |
| 4 | 2Y |
| 5 | 3A |
| 6 | 3Y |
| 7 | GND |
| 8 | 4Y |
| 9 | 4A |
| 10 | 5Y |
| 11 | 5A |
| 12 | 6Y |
| 13 | 6A |
| 14 | VCC |

### 74LS08 · 4 × AND TTL

Cuatro AND TTL.

- Encapsulado: DIP-14 (marcado SN74LS08N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 4,75 a 5,25 V (TTL); el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74LS08)

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1B |
| 3 | 1Y |
| 4 | 2A |
| 5 | 2B |
| 6 | 2Y |
| 7 | GND |
| 8 | 3Y |
| 9 | 3A |
| 10 | 3B |
| 11 | 4Y |
| 12 | 4A |
| 13 | 4B |
| 14 | VCC |

### 74LS32 · 4 × OR TTL

Cuatro OR TTL.

- Encapsulado: DIP-14 (marcado SN74LS32N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 4,75 a 5,25 V (TTL); el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74LS32)

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1B |
| 3 | 1Y |
| 4 | 2A |
| 5 | 2B |
| 6 | 2Y |
| 7 | GND |
| 8 | 3Y |
| 9 | 3A |
| 10 | 3B |
| 11 | 4Y |
| 12 | 4A |
| 13 | 4B |
| 14 | VCC |

### 74LS86 · 4 × XOR TTL

Cuatro XOR TTL.

- Encapsulado: DIP-14 (marcado SN74LS86N)
- Alimentación: pata 14 (VCC) y pata 7 (GND), de 4,75 a 5,25 V (TTL); el simulador lo da por dañado sobre 7 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/SN74LS86A)  
TI lo publica como SN74LS86A.

| Pata | Nombre |
|---:|---|
| 1 | 1A |
| 2 | 1B |
| 3 | 1Y |
| 4 | 2A |
| 5 | 2B |
| 6 | 2Y |
| 7 | GND |
| 8 | 3Y |
| 9 | 3A |
| 10 | 3B |
| 11 | 4Y |
| 12 | 4A |
| 13 | 4B |
| 14 | VCC |

## Comparadores

### LM339 · 4 × comparador

Cuatro comparadores de colector abierto: la salida se va a GND cuando IN− > IN+ y queda abierta (necesita pull-up) cuando IN+ > IN−.

- Encapsulado: DIP-14 (marcado LM339N)
- Alimentación: pata 3 (VCC) y pata 12 (GND), de 2 a 36 V (salida colector abierto); el simulador lo da por dañado sobre 38 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/LM339)

| Pata | Nombre |
|---:|---|
| 1 | OUT 2 |
| 2 | OUT 1 |
| 3 | VCC |
| 4 | IN1− |
| 5 | IN1+ |
| 6 | IN2− |
| 7 | IN2+ |
| 8 | IN3− |
| 9 | IN3+ |
| 10 | IN4− |
| 11 | IN4+ |
| 12 | GND |
| 13 | OUT 4 |
| 14 | OUT 3 |

### LM393 · 2 × comparador

Doble comparador de colector abierto (el del módulo TCRT5000). Usa un resistor de pull-up en cada salida.

- Encapsulado: DIP-8 (marcado LM393N)
- Alimentación: pata 8 (VCC) y pata 4 (GND), de 2 a 36 V (salida colector abierto); el simulador lo da por dañado sobre 38 V

**Datasheet:** [Texas Instruments](https://www.ti.com/product/LM393)

| Pata | Nombre |
|---:|---|
| 1 | OUT A |
| 2 | IN− A |
| 3 | IN+ A |
| 4 | GND |
| 5 | IN+ B |
| 6 | IN− B |
| 7 | OUT B |
| 8 | VCC |

## Optoacopladores

### PC817 · Optoacoplador DIP-4

LED infrarrojo y fototransistor en el mismo encapsulado, aislados eléctricamente: la corriente del LED (1-2) controla la del transistor (4-3) con CTR ≈ 100 %.

- Encapsulado: DIP-4 (marcado PC817)
- Alimentación: pata 4 (C) y pata 3 (E), de LED 1,2 V · salida hasta 35–80 V; el simulador lo da por dañado sobre 80 V

**Datasheet:** [Sharp](https://global.sharp/products/device/lineup/data/pdf/datasheet/PC817XxNSZ1B_e.pdf)

| Pata | Nombre |
|---:|---|
| 1 | A |
| 2 | K |
| 3 | E |
| 4 | C |

### 4N25 · Optoacoplador DIP-6

Optoacoplador clásico con base accesible (6). CTR ≈ 50 %.

- Encapsulado: DIP-6 (marcado 4N25)
- Alimentación: pata 5 (C) y pata 4 (E), de LED 1,2 V · salida hasta 35–80 V; el simulador lo da por dañado sobre 80 V

**Datasheet:** [Vishay](https://www.vishay.com/docs/83725/4n25.pdf)

| Pata | Nombre |
|---:|---|
| 1 | A |
| 2 | K |
| 3 | NC |
| 4 | E |
| 5 | C |
| 6 | B |
