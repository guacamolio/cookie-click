# cookie-click

& "C:\xampp\php\php.exe" -S 0.0.0.0:8000 -t "C:\Users\rober\cookie-click\kopa\unimportant"

http://127.0.0.1:8000/index.php

## Project structure

- `index.php` - game page
- `css/style.css` - styles
- `js/game.js` - game logic and autosave
- `php/save.php` - save endpoint
- `php/load.php` - load endpoint
- `assets/images/` - game images
- `assets/sounds/` - sound assets
- `data/save-data.json` - local single-player save

Uzdevums: Izveidot radošu un interaktīvu klikšķināšanas spēli (Cookie Clicker tipa)

Mērķis: Izstrādāt tīmekļa spēli, kurā lietotājs klikšķina uz galvenā objekta, lai vāktu punktus, var iegādāties dažādus uzlabojumus un redzēt objekta vizuālās transformācijas, izmantojot HTML, CSS, JavaScript un PHP.

Pamata prasības:

Spēles mehānika:

• Spēle balstās uz klikšķināšanu uz galvenā objekta, lai iegūtu punktus.

• Punkti tiek uzkrāti un tos var izmantot, lai iegādātos dažādus uzlabojumus.

• Spēlē jābūt redzamam pašreizējam punktu skaitam.

Papildiespējas (vismaz 5):

• Spēks /  – palielina punktu skaitu, ko lietotājs iegūst par vienu klikšķi.

• Ātrums / X – samazina laiku starp automātiskajiem punktu pieaugumiem.

• Punktu reizinātājs / multiplier – palielina iegūto punktu daudzumu ar noteiktu koeficientu.

• Automātiskie punkti / automatic_clicker – ļauj iegūt punktus bez lietotāja klikšķināšanas.

• Laika bonusi / bonus_coin – piemēram, dubultie punkti noteiktu laika periodu.

* vault - iedot coin skaitli no 1000-5000 ik pa laikam 

* money_pouch - izvēlies starp 3 maisiem un katrā no viņiem ir kautkāda spēja/nauda

• Papildu uzlabojumus un spēles mehānikas drīkst izveidot pēc savas izvēles.

Objekta transformācijas (vismaz 7 reizes):

Galvenajam spēles objektam spēles laikā ir jāmainās atkarībā no spēlētāja progresa.

Transformācijas var ietvert:

• Objekta krāsas maiņu pēc noteikta punktu skaita.

• Objekta formas maiņu, piemēram, no viena objekta uz citu.

• Objekta izmēra vai novietojuma maiņu.

• Papildu animāciju vai vizuālo efektu parādīšanos.

• Objekta aizvietošanu ar citu attēlu vai SVG elementu.

• Ēnas, spīduma vai citu CSS efektu maiņu.

• Īpašu gala transformāciju, sasniedzot noteiktu punktu vai līmeni.

Skaņas efekti (vismaz 3 efekti):

Spēlē jāizmanto vismaz 3 dažādi skaņas efekti.

Skaņas efektiem jābūt piesaistītiem dažādām spēles darbībām, piemēram:

• Klikšķināšanai.

• Uzlabojuma iegādei.

• Bonusa aktivizēšanai.

• Objekta transformācijai.

• Noteikta līmeņa sasniegšanai.

PHP izmantošana:

PHP jāizmanto jēgpilnai funkcionalitātei, piemēram, datu saglabāšanai, rezultātu apstrādei, spēles sesijas uzturēšanai vai citai ar spēles darbību saistītai funkcionalitātei.

Darba struktūra:

Darba kods jāveido strukturēti. Neveidojiet visu projektu vienā failā.

Projektā jāizmanto atsevišķas mapes un faili, piemēram:

index.php
css/style.css
js/game.js
php/save.php
php/load.php
assets/images/
assets/sounds/

Mapju un failu struktūru drīkst veidot arī citādi, ja tā ir loģiska un pārskatāma.

Svarīgi:

Nav ieteicams izmantot gatavas spēļu sagataves vai pilnībā nokopēt jau gatavu projektu.

Plaģiāta vai cita autora darba iesniegšanas gadījumā darbs var tikt anulēts.

Internetā pieejamos materiālus un dokumentāciju drīkst izmantot, lai izprastu tehnoloģijas un 
atrisinātu problēmas, taču gala risinājumam jābūt paša izstrādātam.

Par unikālas papildiespējas vai spēles mehānikas izveidi iespējams iegūt papildu punktus.

Kodam jābūt strukturētam, pārskatāmam un saprotamam.

Pirms darba iesniegšanas jāpārbauda, vai visas izveidotās funkcijas darbojas korekti.

Saprotoši. Tīrs teksts bez jebkāda sarakstu noformējuma vai zvaigznītēm.

---

# 🪙 Clicker Game — Izstrādes un Funkciju Gids

## 1. Vispārīgais Izskats un Saits

Spēle ir klasisks Idle / Clicker ar tīru un modernu dizainu.
Fons un noskaņa ir silts dzelteni-oranžs gradients ar smuku krītošo monētu fonu, kas reaģē uz klikšķiem.
Galvenajā ekrānā pa kreisi atrodas lielā, klikšķināmā monēta pa vidu. Virs tās ir liels monētu skaitītājs un infobars ar pašreizējo CPS (monētas sekundē) un Click Power (cik iedod viens klikšķis). Apakšējā stūrī atrodas zobrats iestatījumiem.
Pa labi atrodas uzlabojumu panelis ar pirkšanas pogām (1x, 10x, 100x, MAX) un visu pieejamo uzlabojumu sarakstu.

---

## 2. Monētu Līmeņi (Coin Tiers) un Progresija

Lai monēta nemainītu krāsas haotiski, krāsu maiņa un vizuālais upgrade ir padarīts par spēlētāja rokasgrāmatu.

Līmeņu ceļš ir šāds: Copper (Varš) -> Silver (Sudrabs) -> Gold (Zelts) -> Platinum (Platīns) -> Diamond (Dimants) -> Cosmic (Kosmoss).

Uzlabojumu saraksta pašā augšā parādās poga "Upgrade Coin Tier". Lai to nopirktu, nepietiek tikai ar naudu — tev ir jābūt arī nopirktam noteiktam skaitam citu uzlabojumu. Piemēram, vismaz 15 uzlabojumi un 5,000¢ bilancē sudraba monētai.

Katrs līmenis iedod monētai citu spīdumu, stilīgāku toni un jaunus vizuālos efektus, kā arī unikālu pasīvo bonusu. Sudraba monēta dod 33% ātrāku zelta monētu parādīšanos, bet platīna monēta dod 10% atlaidi uzlabojumiem.

---

## 3. Uzlabojumu Pirkšana un "MAX" Režīms

Iepirkšanās ir padarīta maksimāli ērta.

Daudzuma slēdži (1x, 10x, 100x, MAX) ļauj ātri iepirkt uzlabojumus pakās. MAX režīms pats sarēķina, cik tieši līmeņus vari atļauties ar savu pašreizējo piķi.

Spēlētājs var uzlabot Click Power, kas palielina monētu skaitu no viena klikšķa, un Auto Clickers / CPS, kas ir pasīvie ienākumi katru sekundi.

Katrs nākamais uzlabojuma līmenis paliek dārgāks par aptuveni 15 procentiem.

---

## 4. Random Notikumi un Bonusi

Bezgalīgais 2x uzlabojums veikalā pilnībā salauza spēles bilanci, tāpēc tas tika aizstāts ar nejaušiem notikumiem.

Zelta Monēta parādās nejaušā vietā uz ekrāna ik pēc 2 līdz 5 minūtēm un pamazām izdziest, ja uz tās neuzspiež. Ja uzklikšķina, tā iedod 2x multiplikatoru gan klikšķim, gan CPS uz 60 sekundēm.

Naudas Maks ir veiksmes spēle, kas izlec ik pēc 5 līdz 10 minūtēm. Spēlētājam dod izvēlēties 1 no 3 maisiņiem. Balvā var dabūt lielo monētu kaudzi, 60 sekunžu 2x boostu vai patstāvīgu CPS bonusu.

---

## 5. Sasniegumi (Achievements System)

Spēlē ir ieplānota sasniegumu sistēma, kas atbloķē jaunus mērķus un dod papildu motivāciju turpināt spēlēt.

Pieejamie sasniegumu veidi:
Click Master prasa sasniegt noteiktu kopējo klikšķu skaitu.
Tycoon Progress prasa sakrāt noteiktu kopējo monētu daudzumu.
Investor prasa nopirkt noteiktu skaitu uzlabojumu vai sasniegt augstākos Coin Tiers.
Lucky Collector prasa noklikšķināt uz noteikta skaita Zelta Monētu un atvērt vismaz 10 Naudas Makus.

Iestatījumu izvēlnē atradīsies saraksts ar sasniegumu ikonām. Izpildīts sasniegums izgaismojas un parāda paziņojumu ekrāna stūrī. Katrs izpildītais sasniegums iedod nelielu pastāvīgu ienākumu bonusu (+2% visai peļņai) vai vienreizēju monētu balvu.

---

## 6. Saglabāšana un Ielāde (PHP Save/Load)

Visa progress saglabāšana notiek caur PHP backendu (save_load.php).

Ar JavaScript fetch() tiek nosūtīts pieprasījums serverim, kas saglabā datus save.json failā.

Tiek saglabāts monētu daudzums, CPS un Click Power rādītāji, pašreizējais Monētas līmenis (Coin Tier), visi nopirktie uzlabojumi, to cenas, kā arī izpildītie sasniegumi un to statuss.

Saglabāt un ielādēt spēli var jebkurā brīdī caur iestatījumu logu.

---

## 7. Sīkumi un Vizuālie Efekti

Visi klikšķi un pirkumi atskaņo sintezētas Web Audio API skaņas.
Klikšķinot uz monētas, izlec teksts +1¢ vai +5¢, kas paies uz augšu un izgaist.
Visa spēles saskarne un teksts ir 100% angliski.