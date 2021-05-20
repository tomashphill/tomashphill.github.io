// populateLaureatesSelect :: Iterable string -> HTMLElement
const populateLaureatesSelect = (laureates) => {
    let laureatesSorted = Array.from(laureates);
    laureatesSorted.sort();
    const select = document.getElementById('laureates');

    laureatesSorted.forEach((n) => { 
        const option = document.createElement('option');
        option.text = n;
        select.add(option); 
    });

    $(select).select2({
        placeholder: 'Select a specific laureate...',
        width: '100%'
    });
    return select;
}

// filterVerbs :: {string: any} -> [string]
const filterVerbs = (obj) => {
    const notVerbs = [
        'url',
        'laureate',
        'year',
        'day',
        'index',
        'nobel_prize',
        'sent'
    ];

    return Object.keys(obj).filter((key) => !notVerbs.includes(key));
}

// verbClick :: Event -> ()
const verbClick = (event) => {
    const el = event.target;
    if (el.isClicked) {
        el.isClicked = false;
        el.classList = '';
        el.innerText = `x ${el.verb}`;
    } else {
        el.isClicked = true;
        el.classList = 'checked';
        el.innerText = `v ${el.verb}`;
    }
}

// populateVerbButtons :: [string] -> HTMLElement
const populateVerbButtons = (verbs) => {
    verbs.sort();
    const verbButtons = document.getElementById('verbs');
    const buttons = verbs.map((v) => {
        const button = document.createElement('button');
        button.innerHTML = 'x ' + v;
        button.verb = v;
        button.isClicked = false;
        verbButtons.appendChild(button);
        return button;
    });

    verbButtons.buttons = buttons;
    return verbButtons;
}

// assembleGrid :: int -> HTMLElement
const assembleGrid = (nRows) => {
    const grid = document.getElementById('grid');
    const nCellsPerRow = 10;

    // addCellsToRow :: HTMLElement -> [HTMLElement]
    const addCellsToRow = (row) => {
        return Array.from(Array(nCellsPerRow)).map(() => {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            row.appendChild(cell);
            return cell;
        });
    }

    const rows = Array.from(Array(nRows)).map(() => {
        const row = document.createElement('div');
        row.classList.add('row');
        const cells = addCellsToRow(row);
        row.cells = cells;
        grid.appendChild(row);
        return row;
    }); 

    grid.cells = rows.flatMap((r) => r.cells);
    return grid;
}

// getRGB :: string -> [int]
const getRGB = (rgb) => {
    return rgb.slice(4, -1).split(',').map(s => +s.trim());
}

// setup :: object -> ()
const setup = (csv) => {
    // remove empty final row
    const data = csv.data.slice(0, -1)//.filter(d => d.sent !== 'Died');

    const maxYear = data.reduce((acc, cv) => acc > cv.year ? acc : cv.year, 0);
    const nRows = Math.ceil(maxYear / 10);
    
    const grid = assembleGrid(nRows);
    const laureates = populateLaureatesSelect(new Set(data.map((d) => d.laureate)));
    const verbs = populateVerbButtons(filterVerbs(data[0]));

    let selectedLaureates = [];
    let selectedVerbs = [];

    // updateGrid :: ('verb' | 'laureates', string) -> ()
    const updateGrid = (target, val) => {
        grid.cells.forEach((c) => {
            c.data = [];
            c.style.backgroundColor = `rgb(255,255,255)`
        });

        const update = (state, val) => {
            const i = state.indexOf(val);
            i > -1 ? state.splice(i, 1) 
                   : state.push(val);
        }

        if (target === 'verb') {
            update(selectedVerbs, val);
        } else if (target === 'laureates') {
            update(selectedLaureates, val);
        }

        const trace = i => { console.log(i); return i; }

        let verbFilter = () => true
        if (selectedVerbs.length > 0) {
            verbFilter = (d) => selectedVerbs.some((v) => d[v] === 'True');
        }

        let laureatesFilter = () => true
        if (selectedLaureates.length > 0) {
            laureatesFilter = ({ laureate }) => selectedLaureates.includes(laureate);
        }

        data.filter(verbFilter)
            .filter(laureatesFilter)
            .forEach(({year, laureate, sent}, _, { length }) => {
                const cell = grid.cells[year];
                cell.data.push({laureate, sent});

                let [g, r, b] = getRGB(cell.style.backgroundColor);
                const std = Math.ceil((550) / length)

                if (r === 255 & g === 255 & b === 255) {
                    b = 100;
                    g = 100;
                } else if (b >= 5 & r >= 5) {
                    b -= std * 3;
                    g -= std * 3;
                } else if (g <= 250) {
                    g += std * 2
                } else {
                    r -= std;
                }
                cell.style.backgroundColor = `rgb(${[g,r,b].join()})`
            })
    }

    const updateDescription = (e) => {
        const descriptions = document.getElementById('descriptions');
        const desc = e.target.data;
        const html = desc.map(({laureate, sent}) => {
            return `<div class="description-unit"><h3>${laureate}</h3><p>${sent}</p></div><hr>`
        }).join('');
        descriptions.innerHTML = `<h1>${e.target.title}</h1>` + html;
    }

    verbs.buttons.forEach((b) => { 
        b.onclick = (e) => (verbClick(e), updateGrid('verb', e.target.verb)); 
    });

    const laureatesChanged = (e) => {
        const laureate = e.params.data.text;
        updateGrid('laureates', laureate);       
    }

    $(laureates).on('select2:select', laureatesChanged);
    $(laureates).on('select2:unselect', laureatesChanged);

    grid.cells.forEach((c, i) => {
        c.title = 'Year ' + (i+1);
        c.onclick = updateDescription; 
    });

    updateGrid();
}

// run :: string -> ()
const run = (csvPath) => {
    Papa.parse(csvPath, {
        download: true,
        delimiter: ',',
        dynamicTyping: true,
        header: true,
        complete: setup
    });
}

run('./data/nobel_laureates.csv');

