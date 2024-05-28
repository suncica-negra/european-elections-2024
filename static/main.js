const isMob = window.innerWidth < 900;
let loaderWrapper = null;

function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';

    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }

    return color;
}

function setLiveOrNot(live) {
    const liveElement = document.querySelector('.live');
    if (liveElement && !live) liveElement.style.visibility = 'hidden';
}

function fixTooltipPosition() {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) document.documentElement.style.setProperty('--textShadow', '0 0 1.3px #090909');

    const allTooltips = document.querySelectorAll('.tooltip_wrapper .tooltip');

    allTooltips?.forEach(e => {
        if (isSafari) e.classList.add('after_safari');

        if (!isMob) {
            const tooltipPosition = e.getBoundingClientRect();

            if (tooltipPosition && ((tooltipPosition.x + tooltipPosition.width) > window.innerWidth)) {
                const parent = e.parentNode;
                if (parent) {
                    parent.style.left = 'unset';
                    parent.style.right = '90%';
                    parent.style.setProperty('--tooltipPadding', '10px 20px 10px 5px');
                }
                e.classList.add('hide_after','display_before');

                if (isSafari) e.classList.add('hide_after','display_before_safari');
            }
        }
    });
}

function percentToPixel(percent) {
    let min = 39, max = 143;

    return ((percent / 100) * (max - min)) + min;
}

function pluralizeVotes(stringVotes) {
    if (!stringVotes) return '';

    if (stringVotes.endsWith('1') && !stringVotes.endsWith('11')) return '';
    else if (['2', '3', '4'].some(num => stringVotes.endsWith(num))) return 'A';
    else return 'OVA';
}

function placeDataInHtml(responseData) {
    document.getElementById('election_results').replaceChildren();

    let tooltipHeader = 'Detalji:';
    const dataToProcess = [...responseData.lista];

    if (responseData['list-bez-mandata']) dataToProcess.push(...responseData['list-bez-mandata']);

    let maxVotes = 1000000;
    const allVotes = [];

    dataToProcess?.forEach(m => {
        allVotes.push(Number(m.glasova));
    });

    maxVotes = Math.max(...allVotes);

    const fragment = new DocumentFragment();

    dataToProcess?.forEach(e => {
        const config = e.config;
        const wrapperDiv = document.createElement('div');
        wrapperDiv.setAttribute('class', 'party_result_wrapper');

        const party = document.createElement('p');
        party.textContent = config ? config.short_name : e.naziv;
        party.setAttribute('class', 'party');
        wrapperDiv.appendChild(party);

        const mandateElement = document.createElement('p');
        const brMandata = e.brMandata ? e.brMandata : 0;
        mandateElement.textContent = brMandata;

        const mandateSpanElement = document.createElement('span');
        mandateSpanElement.textContent = ((brMandata.toString()).endsWith('1') && brMandata !== 11) ? 'MANDAT' : 'MANDATA';
        mandateElement.appendChild(mandateSpanElement);

        const votesElement = document.createElement('span');
        const stringVotes = e.glasova.toString();
        const pluralized = pluralizeVotes(stringVotes);
        votesElement.textContent = `${stringVotes.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} GLAS${pluralized}`;

        mandateElement.appendChild(votesElement);

        // graph start
        const graphicalRepresentation = document.createElement('div');
        let percent = (e.glasova/maxVotes)*100;
        if (percent < 1) percent = 1;
        const howManyPixels = percentToPixel(percent);

        setTimeout(() => {
            graphicalRepresentation.style.height = `${percent}%`;
            mandateElement.style.bottom = `${howManyPixels}px`;
        }, 150);

        const graphColor = (config && config.color) ? config.color : getRandomColor();
        graphicalRepresentation.style.backgroundColor = graphColor;

        if (config && config.hover) {
            graphicalRepresentation.style.setProperty('--graphHover', config.hover);
            graphicalRepresentation.style.filter = 'unset';
        } else graphicalRepresentation.style.setProperty('--graphHover', graphColor);

        graphicalRepresentation.setAttribute('class', 'graph');

        const graphWrapper = document.createElement('div');
        graphWrapper.setAttribute('class', 'graph_wrapper');
        graphWrapper.appendChild(graphicalRepresentation);

        wrapperDiv.appendChild(graphWrapper);
        wrapperDiv.appendChild(mandateElement);
        // graph end

        // tooltip start
        if (brMandata > 0) {
            const divTooltipWrapper = document.createElement('div');
            divTooltipWrapper.setAttribute('class', 'tooltip_wrapper scrollable_wrapper');
            const divTag = document.createElement('div');
            divTag.setAttribute('class', 'tooltip');
            const tooltipP = document.createElement('p');
            tooltipP.textContent = tooltipHeader;
            divTag.appendChild(tooltipP);
            divTooltipWrapper.appendChild(divTag);
    
            const tooltipOlElement = document.createElement('ul');
            let dataForProcess = e.lista;
    
            dataForProcess?.forEach(s => {
                const liTag = document.createElement('li');
                liTag.textContent = `${s.naziv} - `;

                const plurVotes = pluralizeVotes(s.glasova.toString());

                const strongTag = document.createElement('strong');
                strongTag.textContent = `${s.glasova} glas${plurVotes.toLocaleLowerCase()}`;
                liTag.appendChild(strongTag);
                tooltipOlElement.appendChild(liTag);
            });

            divTag.appendChild(tooltipOlElement);
            wrapperDiv.appendChild(divTooltipWrapper);
        }
        // tooltip end

        fragment.appendChild(wrapperDiv);
    });

    const resultsElement = document.getElementById('election_results');
    resultsElement.appendChild(fragment);

    fixTooltipPosition();

    if (loaderWrapper) loaderWrapper.style.display = 'none';
}

function setProcessedVotesAndLastChange(vrijeme, bmObradjenoPosto, refresh = true) {
    const destination = document.getElementById('processed_votes_and_last_change');

    if (!destination) return;

    if (refresh) destination.replaceChildren();

    const tempInfo = document.getElementById('processed_votes_and_last_change_template');
    const cloneInfo = tempInfo.content.cloneNode(true);
    const processedVotes = cloneInfo.getElementById('processed_votes');

    processedVotes.textContent = (`${bmObradjenoPosto}%`) + processedVotes.textContent;

    const lastChange = cloneInfo.getElementById('last_change');
    const lastUpdated = vrijeme?.split(':');
    const paddedTime = lastUpdated?.map(i => i.padStart(2, '0'));
    lastChange.textContent += `${paddedTime?.join(':')} H`;

    destination.appendChild(cloneInfo);
}

function autoRefresh() {
    if (loaderWrapper) loaderWrapper.style.display = 'block';

    getElectionsData(true);
}

async function getElectionsData(refresh = false) {
    urlBase = 'https://showcase.24sata.hr/izbori2024/';

    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });
    const queryParam = params.json;
    const urlVariable = queryParam ? queryParam : 'eu-elections-2024.json';
    url = `${urlBase}${urlVariable}`;

    fetch(url).then((response) => {
        if (response.ok) {
            return response.json();
        }
    })
    .then((responseJson) => {
        if (refresh) {
            setLiveOrNot(responseJson.live);
            setProcessedVotesAndLastChange(responseJson.vrijeme, responseJson.bmObradjenoPosto);

            if (loaderWrapper) loaderWrapper.style.display = 'none';

            return;
        }

        loaderWrapper = document.querySelector('.loader_wrapper');

        setLiveOrNot(responseJson.live);
        setProcessedVotesAndLastChange(responseJson.vrijeme, responseJson.bmObradjenoPosto, false);
        placeDataInHtml(responseJson);

        if (responseJson.live) {
            const interval = responseJson.interval || 60000;
            setInterval(autoRefresh, interval);
        }
    })
    .catch((error) => {
        console.error(`[Elections widget] Election results data were not retrieved due to: \n${error}`);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    getElectionsData();
});

function debounce (fn, delay) {
    let timer = null;

    return function () {
        const context = this;
        const args = arguments;

        clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(context, args);
        }, delay);
    };
}

window.addEventListener('resize', debounce(() => {
    if ((window.innerWidth < 900) !== isMob) {
        window.location.reload();
    }
}, 200));
