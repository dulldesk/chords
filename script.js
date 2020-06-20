// Not supported in IE
let keys = ((new URLSearchParams(window.location.search)).get('keys')+"-").split('-').slice(0,-1).map(i => i.replace('s','#'));

const keyboard = $('#keyboard');
const instr = {'piano' : 0, 'organ': 1, 'acoustic': 2, 'edm': 3};

Synth.debug();

const piano = Synth.createInstrument('piano');
let currOct = 4;

let holdCtrl = false;
let toPlay = [];

let drag = false;

$(document).ready(_ => {
	$('#play-url').hide();
	$('#save').hide();
	$('#play').hide();
	$('#share').hide();
	$('#copy-conf').hide();

	genKeyboard();

	addPlayChordURL();
	addCtrlPress();

	addOctaveChange();

	// $('#save').click(_ => {
		// saveChord();
	// });

	$('#play').click(_ => {
		playChord();
	});

	$('#copy-url').click(_ => {
		copyChordURL();
	});

	detectMouseDown();
});

function detectMouseDown() {
	$(document).mousedown(() => {
		drag = true;
	});

	$(document).mouseup(() => {
		drag = false;
	});	
}

function addOctaveChange() {
	$('#left').click(_ => {
		if (currOct>2) {
			currOct--;
			updateBoard();
		}
	});

	$('#right').click(_ => {
		if (currOct+2<6) {
			currOct++;
			updateBoard();
		}
	});

	function updateBoard() {
		genKeyboard(false);
		$('#octaves').text(`C${currOct} - C${currOct+2}`);
	}
}

function saveChord() {}

function shareChord() {
	if (toPlay.length>0) {
		$('#share').show();
		$('#chord-url').text(getChordURL());
		$('#chord-url').attr('href','https://'+getChordURL());
	} else {
		$('#share').hide();
	}
}

function copyChordURL() {
    let range = document.createRange();
    range.selectNode($(`#chord-url`)[0]);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range); 
    document.execCommand("copy");
    window.getSelection().removeAllRanges();

    $('#copy-conf').show();
    setTimeout(()=>$('#copy-conf').fadeOut(),1000);
}

function addPlayChordURL() {
	processChordURL();
	if (keys) {
		$('#play-url').click(_ => {
			for (let key of keys) {
				if (key) {
					const lastInd = key.length-1;
					const oct = key[lastInd]/1;
					const note = key.substring(0,lastInd).toUpperCase();

					piano.play(note,oct, 2);
				}
			}
		});		
		$('#play-url').show();
		$('#url-data').show();
		$('#chord-in-url').text(keys.map(i=> i==false ? "" : i).join(" - "));
	} 
}

function processChordURL() {
	if (keys[0] != "null" && keys.length > 0) {
		for (let i=0;i<keys.length;i++) {
			let key = keys[i];
			try {
				if (key.length < 2) throw "empty";

				const lastInd = key.length-1;
				const oct = key[lastInd]/1;
				let note = key.substring(0,lastInd).toUpperCase();

				if (note=='E#') note = 'F';
				else if (note=='B#') note = 'C';
				else if (note.length == 2 && note[1] == 'B') {
					note = String.fromCharCode(note[0].charCodeAt(0)-1);
					if (note == '@') note = 'G';
					if (note != 'E' && note != 'B') note += '#';
				}
				keys[i] = note+oct;
			} catch (e) {
				keys[i]=false; if (e!="empty") console.log(e);
			}
		}
	} else keys = false;
}

function getChordURL() {
	let path = "dulldesk.github.io/chords?keys=";
	for (let key of toPlay) {
		path += key[0]+key[1]+'-';
	}
	path = path.replace(/#/g,'s').substring(0,path.length-1);
	return path;
}

function addCtrlPress() {
	$(document).keydown(evt => {
		if (evt.ctrlKey) pressCtrl();
	});

	$('body').keyup(evt => {
		if (!($('#sticky').text().startsWith('Release'))) releaseCtrl();
	});

	$('#sticky').click(_ => {
		if ($('#sticky').text().startsWith('Release')) {
			releaseCtrl();
		} else {
			$('#sticky').text('Release sticky ctrl');
			// $('#save').show();
			pressCtrl();
		}
	});
}

function pressCtrl(release=false) {
	if (release) {
		releaseCtrl();
		return;
	}
	holdCtrl = true;
	$('#play').show();
	$('#ctrl').text('Holding control - select notes to add to a chord');
}

function releaseCtrl() {
	// $('#save').hide();
	$('#share').hide();
	$('#chord-url').text("");
	holdCtrl = false;
	if (toPlay.length > 0) {
		// console.log(toPlay);
		playChord();
		$('.selected').map((ind,elm) => $(elm).removeClass('selected'));
		toPlay = [];
	}
	$('#play').hide();
	$('#sticky').text('Sticky control');
	$('#ctrl').text('Hold control to select multiple notes to add to a chord');
}

function playChord() {
	for (let key of toPlay) {
		piano.play(key[0],key[1],key[2]);
	}
}

function genKeyboard(add=true) {
	const notes = "CDEFGAB";
	const sharps = "CDFGA";
	let coords = $('#keyboard')[0].getBoundingClientRect()
	let left=coords.x;
	for (let oct=currOct;oct<=currOct+2;oct++) {
		for (let c of notes) {
			addKey(c,oct,left,add);
			if (sharps.includes(c)) {
				addKey(`${c}#`,oct,left+26,add);
			}
			left += 40;
		}
	}
}

// add data attribute
// each key is c0, name
// change according to that
function addKey(k,oct,l,add=true) {
	const nom = `${k}${oct}`;
	const dataid = `${k.replace('#','s')}${oct-currOct}`;
	const isWhite = !k.includes('#');

	if (!add) {
		$(`#${dataid}`).attr('data-key',`${k}-${oct}`);
		$(`#${dataid} .label`).text(nom);
		return;
	}

	let div = $('<div></div>');
	let p = $('<p></p>');
	div.addClass(isWhite ? 'white' : 'black');
	div.addClass('key');
	div.attr('id',`${dataid}`);
	div.attr('data-key',`${k}-${oct}`);
	div.css('left',l);
	p.addClass("label");
	p.text(nom);
	div.append(p);
	keyboard.append(div);

	div.click(_ => {
		// datakey may change
		const datakey = div.attr('data-key').split('-');
		const note = datakey[0].replace('s','#');
		const octv = datakey[1];

		if (holdCtrl) {
			if (div.hasClass('selected')) {
				toPlay = toPlay.filter(i => !(i[0] == note && i[1] == octv)); //toPlay.delete([k,oct,2]);
				div.removeClass('selected');
			} else {
				toPlay.push([note,octv,2]);
				div.addClass('selected');
			}
			shareChord();
		} else piano.play(note,octv, 2);
	});
}