/*
 * This code is written is a pseudo-functional style,
 * Since objects and state are still passed by reference,
 * A rudimentary State Monad is used to chain the state of
 * the document body, using closures. I had a good time
 * coding this up, especially attempting to translate the
 * state monad into javascript and using Hindley-Milner
 * type annotations! :-)
 * 
 */

// State s a { runState :: s -> [s, a] }
const State = (runState) => ({
    // run :: State s a ~> s -> [s, a]
    run: runState,
    // map :: State s a ~> (a -> b) -> State s b
    map: (fn) => State((s) => {
        const [newState, result] = runState(s);
        return [newState, fn(result)];
    }),
    // chain :: State s a ~> (a -> State s b) -> State s b
    chain: (fn) => State((s) => {
        const [newState, result] = runState(s);
        return fn(result).run(newState);
    })
});

// State.of :: a -> State s a
State.of = (a) => State((s) => [s, a]);

// State.get :: State s s
State.get = State((s) => [s, s]);


// returnsState :: Function -> Bool
const returnsState = (fn) => 
    fn.toString().includes('State((');

// ...(map | chain) -> State s a -> State s b
const composeState = (...fns) => (initState) => 
    fns.reduce((currState, f) => returnsState(f) ? currState.chain(f) : currState.map(f), initState);


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
// Utils

// compose :: ((a -> b), (b -> c), ..., (y -> z)) -> a -> z
const compose = (...fns) => (x) => fns.reduce((acc, f) => f(acc), x);

// range :: Int -> [Int]
const range = i => [...Array(i).keys()];

// createElement :: String -> HTMLElement
const createElement = (type) => document.createElement(type);

// trace :: a -> a
const trace = (message) => (a) => {
    console.log(message, a);
    return a;
}

// randomInRange :: (Int, Int) -> Int
const randomInRange = (x, y) => Math.floor(Math.random() * (y - x) + x);

// setProperty :: (String, a) -> (Object -> Object)
const setProperty = (path, value) => (object) => {
    // pathArr :: [String]
    const pathArr = path.split(".");
    // prop :: String
    const prop = pathArr.pop();
    // changeThis :: Object
    const changeThis = pathArr.reduce((prev, curr) => prev && prev[curr], object);
    // mutation, object passed by reference
    changeThis[prop] = value;

    return object;
}

// arrowsMap :: {Int: Int}
const arrowsMap = {
    2190: 2192, 2192: 2190,
    2191: 2193, 2193: 2191,
    2196: 2198, 2198: 2196,
    2197: 2199, 2199: 2197,
};
// arrows :: [Int]
const arrows = Object.values(arrowsMap);

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
// Document Manipulation

const UnitsSpec = (unitSideLength, unitsWide, unitsTall) => ({
    unitSideLength, // :: Float
    unitsWide, // :: Int
    unitsTall // :: Int
});

// getSpec :: [[HTMLElement]] -> UnitsSpec
const getSpec = (units) => {
    const exUnit = units[0][0]; // :: HTMLElement
    const len = parseFloat(exUnit.style.width); // :: Float
    const w = units[0].length; // :: Int
    const h = units.length; // :: Int
    return UnitsSpec(len, w, h); 
}

// getUnitSpecs :: Int -> State documentBody UnitSpec
const createUnitSpecs = (nUnits) => State((documentBody) => {
    const body = documentBody.getClientRects()[0];
    const bodyArea = body.width * body.height;
    const unitArea = bodyArea / nUnits;

    // unitSideLength :: Float
    const unitSideLength = Math.sqrt(unitArea);
    // unitsWide :: Int
    const unitsWide = Math.round(body.width / unitSideLength);
    // unitsTall :: Int
    const unitsTall = Math.round(body.height / unitSideLength);
    // spec :: UnitSpec
    const spec = UnitsSpec(unitSideLength - 0.3, unitsWide, unitsTall);

    return [documentBody, spec];
});

// createUnits :: UnitsSpec -> [[HTMLElement]]
const createUnits = (spec) => {
    const {
        unitSideLength: len, 
        unitsWide: nW, 
        unitsTall: nT
     } = spec;

    const units = range(nT).map((y) =>
        range(nW).map((x) => {
            // span :: HTMLElement
            const span = createElement("span"); 
            // editSpanStyle :: HTMLElement -> HTMLElement
            const editSpanStyle = compose(
                setProperty('style.width', `${ len }px`),
                setProperty('style.height', `${ len }px`),
                setProperty('style.left', `${ x * len }px`),
                setProperty('style.top', `${ y * len }px`),
                (el => { el.classList.add("unit"); return el; })
            );
            return editSpanStyle(span);
        })
    );
    return units; // :: [[HTMLElement]]
}

// populateChars :: String -> [[HTMLElement]] -> [[HTMLElement]]
const populateChars = (units) => {
    // innerHTML :: String -> String
    const html = (c) => `<span class="unit contained">${ c }</span>`;
    const topLeft = '❋'; // :: String
    const repeated = '_-`-'; // :: String

    const unitsWithChars = units.map((unitsY, y) =>
        unitsY.map((unitX, x) => {
            // setChar :: HTMLElement -> HTMLElement
            const setChar = 
                x === 0 && y === 0 ?
                setProperty("innerHTML", html(topLeft)) :
                setProperty("innerHTML", html(repeated[(x + y) % repeated.length]));
            return setChar(unitX); // HTMLElement
        })
    );
    return unitsWithChars; // [[HTMLElement]]
}

// appendToGridAndCenter :: [[HTMLElement]] -> State documetBody [[HTMLElement]]
const appendToGridAndCenter = (els) => State((documentBody) => {
    // grid :: HTMLElement
    const grid = documentBody.children['grid'];
    // appendToGrid :: HTMLElement -> HTMLElement
    const appendToGrid = (e) => { grid.appendChild(e); return e; }
    const appended = els.map((elsy) => elsy.map(appendToGrid));

    // extracting unit width/height/len properties
    const {
        unitSideLength: len, 
        unitsWide: nW, 
        unitsTall: nT
     } = getSpec(els);

    const h = len * nT; // :: Float
    const w = len * nW; // :: Float

    // adjustedGrid :: HTMLElement -> HTMLElement
    // reflected in documentBody
    const adjustedGrid = compose(
        setProperty('style.height', `${ h }px`),
        setProperty('style.width',`${ w }px`)
    )(grid)

    return [documentBody, els];
});

// makeMainMenu :: [[HTMLElement]] -> State documetBody [[HTMLElement]]
const makeMainMenu = (units) => State((documentBody) => {
    // mainMenu :: HTMLElement
    const mainMenu = documentBody.children['grid'].children['main-menu']; 
    const {
        unitSideLength: len, 
        unitsWide: nW, 
        unitsTall: nT
     } = getSpec(units);

     const mainMenuUnitLen = 10; // Int
     const mainMenuPxLen = mainMenuUnitLen * len; // Float
     const startAt = 1;
     const endAtY = nT - mainMenuUnitLen;
     const endAtX = nW - mainMenuUnitLen;

     const randomY = randomInRange(startAt, endAtY); // random Int
     const randomX = randomInRange(startAt, endAtX); // random Int

     const getCoord = (x, y) => [
         parseFloat(units[y][x].style.top), 
         parseFloat(units[y][x].style.left)
        ];
    const [top, left] = getCoord(randomX, randomY); // [Float, Float]

    compose(
        setProperty('style.top', `${ top }px`),
        setProperty('style.left', `${ left }px`),
        setProperty('style.width', `${ mainMenuPxLen }px`),
        setProperty('style.height', `${ mainMenuPxLen }px`),
        setProperty('style.display', 'block')
    )(mainMenu); 

    return [documentBody, units];
});

// getRandomImage :: Null -> Promise [String, String]
const getRandomImage = async () => {
    const numPages = 7275;
    const itemsPerPage = 20;
    const randomPage = () => Math.floor(Math.random() * numPages)
    const randomItem = () => Math.floor(Math.random() * itemsPerPage)
    const url = (pageNum) => `https://api.artic.edu/api/v1/images?page=${pageNum}&limit=${itemsPerPage}`;

    // Promise [String, String]
    return fetch(url(randomPage()))
        .then((response) => response.json())
        .then((data) => {
            const artwork = data['data'][randomItem()];
            const title = artwork['artwork_titles'][0];
            const artUrl = artwork['iiif_url'] + '/full/843,/0/default.jpg';
            return [title, artUrl];
        })
}

// renderImg :: (String, [[HTMLElement]]) -> Image
const renderImg = (url, units) => {
    const {
        unitSideLength: len, 
        unitsWide: nW, 
        unitsTall: nT
     } = getSpec(units);

    const imgObj = new Image; // Image

    const onload = function () {
        // Purposefully glitch image
        const randH = randomInRange(nT - 5, nT + 5);
  
        this.height = randH;
        this.width = nT === randH ? nW : Math.ceil(nT*nW / randH);

        tempCxt.drawImage(this, 0, 0, this.width, this.height);
        const pixels = tempCxt.getImageData(0, 0, this.width, this.height).data;

        colorTheUnits(units, pixels);
        delete this;
    }

    var onerror = showError(units);

    return compose(
        setProperty('crossOrigin', 'Anonymous'),
        setProperty('onload', onload),
        setProperty('onerror', onerror),
        setProperty('src', url)
    )(imgObj);
}

// colorTheUnits :: ([[HTMLElement]], [Int]) -> Null
const colorTheUnits = (units, pixels) => {
    // flatUnits :: [HTMLElement]
    const flatUnits = units.flat()//.sort(() => Math.random() - 0.5);
    // randomArrow :: Null -> Int
    const randomArrow = () => arrows[Math.floor(Math.random() * (arrows.length-1))];
    // arrowCode :: Int -> String
    const arrowCode = (arrow) => String.fromCharCode('0x' + arrow.toString());

    for (let i = 0, j = 0;
         i < pixels.length, j < flatUnits.length;
         i += 4, j += 1) {
             setTimeout(() => {
                const unit = flatUnits[j];
                const r = pixels[i];
                const g = pixels[i+1];
                const b = pixels[i+2];

                if (!unit.style.backgroundColor)
                    setProperty('style.backgroundColor', 
                                `rgb(${r},${g},${b})`)(unit);
    
                if (((r+g+b)/3) < 140) 
                    setProperty('style.color', 'white')(unit);
    
                if (!unit.titleSet && j !== 0) {
                    const anArrow = randomArrow();
                    const defaultArrow = arrowCode(anArrow);
                    const hoverArrow = arrowCode(arrowsMap[anArrow]);

                    compose(
                        setProperty('firstChild.innerText', defaultArrow),
                        setProperty('defaultArrow', defaultArrow),
                        setProperty('hoverArrow', hoverArrow)
                    )(unit);

                    unit.addEventListener('mouseover', function () {
                        this.firstChild.innerText = this.hoverArrow;
                    });
                    unit.addEventListener('mouseout', function () {
                        this.firstChild.innerText = this.defaultArrow;
                    });
                }
             }, Math.log(randomInRange(1, 10_000)) * 1000);
         }
}

// linkUrl :: (String, HTMLElement) -> Null
const linkUrl = (url, unit) => {
    setProperty('id', 'link-to-image')(unit);
    unit.onclick = () => window.open(url);
}

// insertTitle :: (String, [[HTMLElement]]) -> Null
const insertTitle = (title, units) => {
    console.log('Title of Artwork:', title);

    // lastRow :: [HTMLElement]
    const lastRow = units[units.length - 1];

    // betterTitle :: String
    const betterTitle = Array.from(title.replace(/\s/g, '*'));

    const fillTitle = (unit, i) => {
        setTimeout(() => {
            unit.titleSet = true;

            if (betterTitle.length) {
                const char = betterTitle.shift();
                if (unit.defaultArrow)
                    setProperty('defaultArrow', char)(unit);
                setProperty('firstChild.innerText', char)(unit);
            } else {
                if (unit.defaultArrow) 
                    setProperty('defaultArrow', '*')(unit);
                setProperty('firstChild.innerText', '*')(unit);
            }

            if (lastRow.includes(unit) && i === lastRow.length-1 && betterTitle.length) {
                const last = units
                    .slice(0, -1)
                    .map((unit) => unit.slice(-1)).flat()
                    .reverse();
                last.forEach(fillTitle);
            }
            
        }, (i+1) * 500);
    }
    
    lastRow.forEach(fillTitle);
}

// showError :: Error -> Null
const showError = (units) => (error) => {
    const err = error.message.replace(/\s/g, '*') + '*';
    const flatUnits = units.flat();
    flatUnits.slice(1).forEach((unit, i) => {
        setTimeout(() => {
            setProperty('firstChild.innerText', err[i % err.length])(unit);
        }, i * 300);
    });
}

// documentBody :: HTMLElement
const documentBody = document.body;
// windowWidth :: Float
const windowWidth = document.body.clientWidth;
// lessThanOrEqual :: Number -> Number -> Bool
const lessThanOrEqual = (num) => (otherNum) => num <= otherNum;
const lteW = lessThanOrEqual(windowWidth);

// initState :: State documentBody Int
const initState = 
    lteW(400) ? State.of(300) : 
    lteW(600) ? State.of(400) :
    lteW(800) ? State.of(500) :
    lteW(1000) ? State.of(700) :
    lteW(1200) ? State.of(900) :
    lteW(1500) ? State.of(1100) :
    State.of(1400);

// program :: State documentBody ()
const setup = composeState(
    trace('# of units: '),
    createUnitSpecs,
    createUnits,
    populateChars,
    appendToGridAndCenter,
    makeMainMenu,
);

const [, units] = setup(initState).run(documentBody);
// end of State... Since the rest is asynchronous.
// Need to investigate the right framework for asynchronous 
// code since it becomes pass by continuation spaghetti code.

let tempCanvas = document.createElement("canvas");
let tempCxt = tempCanvas.getContext("2d");

getRandomImage()
    .then(([title, url]) => {
        console.log('URL to Image:', url)
        renderImg(url, units);
        linkUrl(url, units[0][0])
        if (title) insertTitle(title, units);
    })
    .catch(showError(units));


