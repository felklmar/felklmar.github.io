# **Fraktální generátor terénu**

![Page screenshot!](./readme_images/full_page.png "Page screenshot")

## Úvod

Z nabízených okruhů pro semestrální práci jsem si vybral téma **fraktálů**, které jsem spojil s tématem **zobrazování ve webu**. Abych zvolená témata pokryl, tak jsem vytvořil fraktální generátor terénu, který je vizualizován ve webu pomocí knihovny Three.js.

Struktura projektu:

- Index.html
- fonts - fonty použité na nadpis a text
  - BASQUIAT.otf
  - Printvetica.otf
- modules
  - dat.gui.module.js
  - GLTFExporter.js
  - main.js - hlavní soubor, který obsahuje můj kód pro generování terénu
  - OrbitControls.js
  - three.module.js
- style
  - reset.css - reset nastavení prvků, aby se vzhled stránky dal nastavit tak, aby byl konzistentnější napříč různými prohlížeči
  - styl.css - samotný vzhled stránky
- textures - textury pro mesh objektů
  - dirt.jpg
  - grass.jpg
  - rock.jpg
  - snow.jpg
  - water.jpg

## Příprava scény

Důležité je, aby byla nastavená scéna, protože jinak bych terén nemohl vyzualizovat. Nejdříve se vytvoří a inicializuje renderer, jehož rozměry se nastaví podle okna. Potom se vytvoří objekt typu Scene, tedy vlastní scéna, kam se pak vkládají ostatní objekty. Do scény se tedy rovnou vloží kamera, aby bylo vidět, co ve scéně je. Kromě kamery se rovnou do scény vloží dvě světla, jedno typu AmbientLight a druhé typu DirectionalLight. Všechny tyto objekty jsou součástí knihovny Three.js.

Aby bylo možné s vygenerovaným terénem trošičku interagovat, tak jsem z knihovny Three.js přidal ještě OrbitControls, což umožňuje pohybovat s objekty ve scéně pomocí myši.

- pravé tlačítko - otáčení terénu
- levé tlačítko - přesouvání terénu
- kolečko myši - přiblížení/oddálení

## Třída Terrain

Samotný terén je reprezentovaný pomocí třídy Terrain, který obsahuje informace o jeho detailu, maximální možné výšce rohů terénu a jeho členitosti. Krom toho také obsahuje mesh pro terén a vodu. Mesh vodní hladiny je inicializován přímo v konstruktoru a terén je inicializován zavoláním metody generate. Dále třída obsahuje výchozí barvy a textury pro terén a vodu, které se v konstruktoru načtou ze složky textures a nastaví tak, aby správně seděly na terén nebo vodní hladinu.

### Ukázka textur

<img src = "./terrain_generator/textures/dirt.jpg"  width = "200" height = "200" alt = "Dirt texture"  title = "Dirt texture" >
<img src = "./terrain_generator/textures/grass.jpg" width = "200" height = "200" alt = "Grass texture" title = "Grass texture" >
<img src = "./terrain_generator/textures/rock.jpg"  width = "200" height = "200" alt = "Rock texture"  title = "Rock texture" >
<img src = "./terrain_generator/textures/snow.jpg"  width = "200" height = "200" alt = "Snow texture"  title = "Snow texture" >
<img src = "./terrain_generator/textures/water.png" width = "200" height = "200" alt = "Water texture" title = "Water texture" >

## Generování terénu

Generování terénu funguje tak, že se nejdříve odstraní starý mesh terénu a následně vytvoří nový a vloží se místo původního. Tento mesh vznikne z nově vytvořeného objektu PlaneGeometry a MeshPhongMaterial, který má třída uložený ve členské proměnné. Objekt PlaneGeometry je vytvořen s rozměry 100x100 a jeho strany jsou rozděleny na segmenty. Počet segmentů je stejný na obou stranách a záleží na detailu terénu, který je dán mocninou dvojky. To znamená, že pokud detail terénu bude 3, tak každá strana je rozdělena na 8 segmentů. Toto rozdělení v geometrii meshe udělá mřížku a pak se jednotlivým bodům/vrcholům v mřížce upraví pozice. Každý bod má pozici danou pomocí souřadnic x, y a z. Složky souřadnice x a y jsou zachovány, ale složka z je zaměněna za hodnotu z pole obsahující vygenerované výšky. Toto pole je generováno pomocí [diamond-square algoritmu](https://en.wikipedia.org/wiki/Diamond-square_algorithm).

Práce tohoto algoritmu je popsána na Wikipedii, takže tady je pouze několik drobností, které bych chtěl zmínit. Algoritmus pracuje se čtvercovou maticí, do které jsou ukládány hodnoty reprezentující výšku. Místo dvourozměrného pole jsem použil pole jednorozměrné, se kterým jsem pak pracoval jako s maticí, to znamená, že k jeho prvkům se přistupuje jednoduchým výpočtem **index řádku*šířka matice + index sloupce**. Díky tomuto se mi pak lépe procházelo při aplikování hodnot na body plochy, jak je zmíněno výš.

V každém kroku algoritmu se hodnota dané výšky počítá jako průměr výšek rohů čtverce, nebo diamantu a přičtením náhodně vygenerovaného čísla. Tady jsem se odlišil od Wikipedie a náhodná hodnota se generuje v rozmezí od -roughness po roughness. Hodnota parametru roughness je po provedení square a diamond kroku snížena na polovinu, čímž jsem se snažil docílit toho, aby v terénu nebyly velké výchylky.

Ještě stojí za zmínku, jak se na začátku algoritmu generují výšky hlavních rohů matice. Jejich hodnota závisí na parametru max_init_height, který určuje maximální výšku, které může roh dosahovat, tedy hodnota těchto rohů je z intervalu (0, max_init_height).

## GUI

Aby bylo možné terén nějak modifikovat, tak jsem do projektu zakomponoval i jednoduché gui, které je implementováno pomocí knihovny dat GUI. Menu, kde se tedy dají nastavit vlastnosti terénu, se nachází v pravém horním rohu webové stránky ve formě rolovací nabídky, takže stačí kliknout na možnost **Open Controls** a menu se otevře. Menu je rozdělené na čtyři záložky, které obsahují tato nastavení:

- Terrain Properities - při změně se terén hned přegeneruje
  - Detail - mocniny dvojky od 0 po 10, které ovládájí rozdělení plochy na segmenty a tedy i detail terénu ( vyšší číslo = vyšší detail )
  - Height - maximální výška pro rohy plochy
  - Roughness - členitost terén ( vyšší číslo = vyšší členitost )
- Terrain Surface
  - Wireframe - přepínač, který zobrazí terén jako drátěný model
  - Texture - výběr textury povrchu ( plain, dirt, rock, grass, snow )
  - Color - barva terénu
  - Default Color - vrátí barvu do základního nastavení
- Water Surface
  - Height - výška vodní hladiny
  - Opacity - průhlednost vodní hladiny ( nastavení na 0 slouží k jejímu vypnutí )
  - Texture - výběr textury vody ( plain, water )
  - Color - barva vodní hladiny
  - Default Color - vrátí barvu do základního nastavení
- Animation
  - Animate - přepínač, který vypne/zapne animaci ( rotaci ) terénu
  - Speed - rychlost rotace
- Download Terrain - umožní stáhnout scénu jako scene.glb

Při změně textury se automaticky nastaví barva terénu, nebo vody na bílou, aby textura vypadala tak, jak má. Potom je ale možné barvu normálně změnit.

![GUI!](./readme_images/gui.png "GUI")

## Vzhled stránky

Aby webová stránka vypadala dobře, tak jsem přidal nadpis, krátký popis a tlačítko, jejichž vzhled jsem pak upravil pomocí souboru style.css. Semestrálku jsem testoval v prohlížeči Mozilla Firefox, ale když jsem pak stránku otevřel v prohlížeči Google Chrome, tak font vypadal trochu jinak. Proto jsem na internetu hledal, jak toto vyřešit a narazil jsem na řešení pomocí reset.css souboru, který předtím, než se aplikuje soubor style.css, resetuje nastavení jednotlivých prvků, čímž by se měla zvýšit konzistence vzhledu napříč prohlížeči.

![Text on the page!](./readme_images/page_text.png "Text on the page")

Soubor reset.css jsem našel na internetu, zde je odkaz na autorovu webovku http://meyerweb.com/eric/tools/css/reset/.

Soubor style.css jsem si potom vytvořil vlastní a upravil prvky webu k obrazu svému. Kód na vzhled tlačítka jsem vzal z https://getcssscan.com/css-buttons-examples a pak ho akorát trošku upravil. Funkce zmíněného tlačítka je refreshnout stránku, což způsobí, že se terén znovu vygeneruje.

Ke vzhledu stránky se také váže funkce on_window_resize, kterou jsem implementoval, aby se obsah stránky správně překreslil, když se změní rozměry okna.

<img src = "./readme_images/page_size_1.png"  width = "200" alt = "Page tall" title = "Page tall" >
<img src = "./readme_images/page_size_2.png" height = "200" alt = "Page wide" title = "Page wide" >

## Závěr

Zvolené zadání se mi podařilo splnit a celý tento projekt byl pro mě zajímavou zkušeností, protože jsem dříve s webovými technologiemi a javascriptem nepracoval. Musím přiznat, že na začátku jsem docela tápal, jak co udělat, ale ve finále se mi s javascriptem i knihovnami Three.js a dat GUI pracovalo dobře a práce na této semestrálce mě bavila a zárověň mi poskytla nějaký úvodní vhled do tvorby a programování webových stránek.

Moje semestrální práce je dostupná na tomto odkazu: https://felklmar.github.io/
