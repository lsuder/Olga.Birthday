/*
	Fallout 3 Terminal Hacking Clone
	Design and concept inspired by (read: ripped off from) Fallout 3
	All copyrights and trademarks inc. Fallout property of Bethesda, Zenimax, possibly Interplay

	wordlist-example:
	{"words":["testacy","vespers","bewitch","recheck","stretch","busiest","bedrock","beakers","beleapt","bedewed","beshame","befrets"]}
*/

var columnHeight = 17;
var wordColumnWidth = 12;
var Count = 12;
var Difficulty = 7;
var DudLength = 8;
var Target; // TODO: Add default target.
var Sound = true;
var InfoText = "ROBCO INDUSTRIES (TM) TERMALINK PROTOCOL<br />ENTER PASSWORD NOW";
var Haikus = [
	"Out of memory.<br />We wish to hold the whole sky,<br />But we never will.",
	"Three things are certain:<br />Death, taxes, and lost data.<br />Guess which has occurred.",
	"wind catches lily<br />scatt'ring petals to the wind:<br />segmentation fault",
	"The fence is for you<br />To protect you from danger<br />Don't go past the fence",
	"Joe Roquefort: hero<br />of cryptanalysis in<br />the Second World War.",
	"Math gurus showed us<br />some hash weaknesses. Panic<br />ensues. New hash now!",
	"Two thousand seven,<br />NIST says 'New hash contest now!'<br />Five years later, done."
];
var Correct = "";
var Words = {};
var OutputLines = [];
var AttemptsRemaining = 6;
var Power = "off";
var BracketSets = [
	"<>",
	"[]",
	"{}",
	"()"
];
var gchars =
[
	"'",
	"|",
	"\"",
	"!",
	"@",
	"#",
	"$",
	"%",
	"^",
	"&",
	"*",
	"-",
	"_",
	"+",
	"=",
	".",
	";",
	":",
	"?",
	",",
	"/"
];

Start = function()
{
	let wordsToUse = GetWords(/* length= */ Difficulty, /* count= */ Count);
	StartWithWords(wordsToUse);
}

GetWords = function(length, count) {
	let words = [];
	while (words.length < count) {
		let index = GetRandomInt(0, WORDS.length);
		let potentialWord = WORDS[index];
		if (potentialWord.length === length && !words.includes(potentialWord)) {
			words[words.length] = WORDS[index];
		}
	}
	return words;
}

GetRandomInt = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

Initialize = function(wordLength, count, target)
{
	if (wordLength) {
		Difficulty = wordLength;
	}

	if (count) {
		Count = count;
	}

	if (target) {
		Target = target;
	}

	if (Power == "off")
		return;
		
	if ($.browser.safari || $.browser.msie)
		Sound = false;
	document.onselectstart = function() { return false; }
	
	if (Sound)
		$("#poweron")[0].play();
	
	PopulateScreen();
	
	WordColumnsWithDots();
	FillPointerColumns();
	SetupOutput();
	
	AttemptsRemaining = 6;
	
	JTypeFill("info", InfoText, 20, function()
	{
		UpdateAttempts();
	}, "", "");
	Start();
	
}

WordColumnsWithDots = function()
{
	var column2 = $("#column2");
	var column4 = $("#column4");
	
	var dots = GenerateDotColumn();
	column2.html( dots );
	column4.html( dots );
}

PopulateScreen = function()
{
	$("#terminal").html('<div id="terminal-interior"><div id="info"></div><div id="attempts"></div><div id="column1" class="column pointers"></div><div id="column2" class="column words"></div><div id="column3" class="column pointers"></div><div id="column4" class="column words"></div><div id="output"></div><div id="console">></div></div>');
}

UpdateAttempts = function()
{
	var AttemptString = AttemptsRemaining + " ATTEMPT(S) LEFT: ";
	JTypeFill("attempts", AttemptString, 20, function(){
		var i = 0;
		while (i < AttemptsRemaining)
		{
			AttemptString += " &#9608;";
			i++;
		}
		$("#attempts").html( AttemptString);
	}, "", "");
}

TogglePower = function()
{
	if (Power == "on")
	{
		Power = "off";
		$("#terminal-background-off").css("visibility", "visible");
		$("#terminal").css("background-image", "url('robco-industries/img/bg-off.png')");
		$("#terminal").html("");
		if (Sound)
			$("#poweroff")[0].play();
	}
	else
	{
		Power = "on";
		$("#terminal-background-off").css("visibility", "hidden");
		$("#terminal").css("background-image", "url('robco-industries/img/bg.png')");
		Initialize();
	}
}

JTypeFill = function(containerID, text, TypeSpeed, callback, TypeCharacter, Prefix)
{
	var cont = $("#" + containerID);
	
	if (typeof TypeCharacter == 'undefined' || TypeCharacter == null)
		TypeCharacter = "&#9608;";
	
	if (typeof Prefix == 'undefined' || Prefix == null)
		Prefix = ">";
	
	cont.html("").stop().css("fake-property", 0).animate(
	{
		"fake-property" : text.length
	},
		{
			duration: TypeSpeed * text.length,
			step: function(i)
			{
				var insert = Prefix + text.substr(0, i);
				var i = Math.round(i);
				if (cont.text().substr(0, cont.text().length - 1 ) != insert)
				{
					if (Sound)
						$("#audiostuff").find("audio").eq( Math.floor(Math.random() * $("#audiostuff").find("audio").length) )[0].play();
				}
				cont.html(insert + TypeCharacter);
			},
			complete: callback
		}
	);
}

StartWithWords = function(newWords)
{
	// Words = JSON.parse(Response).words;
	Words = newWords;
	Correct = Words[0];
	console.log(Correct);
	Words = Shuffle(Words);
	FillWordColumns();
}

SetupInteractions = function(column)
{
	column = $(column);
	
	column.find(".character").hover(function()
	{
		if (AttemptsRemaining == 0)
			return false;
			
		$(this).addClass("character-hover");
		
		
		
		if ( !$(this).hasClass("word") && !$(this).hasClass("dudcap") )
		{
			UpdateConsole($(this).text());
			return true;
		}
		
		if ($(this).hasClass("word"))
			UpdateConsole($(this).attr("data-word"));
		else if ($(this).hasClass("dudcap"))
			UpdateConsole($(this).text());
		
		var cur = $(this).prev();
		if (cur.is("br"))
				cur = cur.prev();
		while (cur.hasClass("word") || cur.hasClass("dud"))
		{
			cur.addClass("character-hover");
			cur = cur.prev();
			if (cur.is("br"))
				cur = cur.prev();
		}
		
		var cur = $(this).next();
		if (cur.is("br"))
				cur = cur.next();
		while (cur.hasClass("word") || cur.hasClass("dud"))
		{
			cur.addClass("character-hover");
			cur = cur.next();
			if (cur.is("br"))
				cur = cur.next();
		}
		
	},
	function()
	{
			
		$(this).removeClass("character-hover");
		
		if ( !$(this).hasClass("word") && !$(this).hasClass("dudcap") )
			return true;
		
		var cur = $(this).prev();
		if (cur.is("br"))
				cur = cur.prev();
		while (cur.hasClass("word") || cur.hasClass("dud"))
		{

			cur.removeClass("character-hover");
			cur = cur.prev();
			if (cur.is("br"))
				cur = cur.prev();
		}
		
		var cur = $(this).next();
		if (cur.is("br"))
				cur = cur.next();
		while (cur.hasClass("word") || cur.hasClass("dud"))
		{
			cur.removeClass("character-hover");
			cur = cur.next();
			if (cur.is("br"))
				cur = cur.next();
		}
	});
	
	column.find(".character").click(function()
	{
		if (AttemptsRemaining == 0)
			return false;
			
		var word;
		if ($(this).hasClass("word"))
		{
			if (Sound)
				$("#enter")[0].play();
			word = $(this).attr("data-word");
			UpdateOutput(word);
			
			if (word.toLowerCase() == Correct.toLowerCase())
			{
				if (Sound)
					$("#passgood")[0].play();
				UpdateOutput("");
				UpdateOutput("Exact match!");
				UpdateOutput("Please wait");
				UpdateOutput("while system");
				UpdateOutput("is accessed.");
				AttemptsRemaining = 0;
				Success();
			}
			else
			{
				if (Sound)
					$("#passbad")[0].play();
				UpdateOutput("Access denied");
				UpdateOutput( CompareWords(word, Correct) + "/" + Correct.length + " correct." );
				AttemptsRemaining--;
				UpdateAttempts();
				if (AttemptsRemaining == 0)
					Failure();
			}
		}
		else if ($(this).hasClass("dudcap"))
		{
			if (Sound)
				$("#enter")[0].play();
			HandleBraces( $(this) );
		}
		else
		{
			return false;
		}
	});
}

RemoveDud = function()
{
	var LiveWords = $(".word").not("[data-word='" + Correct.toUpperCase() + "']");
	
	var WordToRemove = $( LiveWords[ Math.floor( Math.random() * LiveWords.length) ] ).attr("data-word");
	
	$("[data-word='" + WordToRemove + "']").each(function(index, elem)
	{
		$(this).text(".").removeClass("word").removeAttr("data-word");
	});
}

HandleBraces = function(DudCap)
{
	if ( Math.round( Math.random() - .3 ) )
	{
		AttemptsRemaining = 6;
		UpdateOutput("");
		UpdateOutput("Allowance");
		UpdateOutput("replenished.");
		UpdateAttempts();
	}
	else
	{
		UpdateOutput("");
		UpdateOutput("Dud removed.");
		RemoveDud();
	}
	
	$(DudCap).text(".").unbind("click");
		var cur = $(DudCap).next();
		if (cur.is("br"))
				cur = cur.next();
		while ( cur.hasClass("dud") )
		{
			if ( cur.hasClass("dudcap") )
			{
				cur.text(".").removeClass("dudcap").unbind("click");
			}
			else
			{
				cur.text(".").unbind("click");
			}
			cur = cur.next();
			if (cur.is("br"))
				cur = cur.next();
		}
		
		var cur = $(DudCap).prev();
		if (cur.is("br"))
				cur = cur.prev();
		while ( cur.hasClass("dud") )
		{
			if ( cur.hasClass("dudcap") )
			{
				cur.text(".").removeClass("dudcap").unbind("click");
			}
			else
			{
				cur.text(".").unbind("click");
			}
			cur = cur.prev();
			if (cur.is("br"))
				cur = cur.prev();
		}
}

Failure = function()
{
	UpdateOutput("Access denied.");
	UpdateOutput("Lockout in");
	UpdateOutput("progress.");
	
	$("#terminal-interior").animate({
		top: -1 * $("#terminal-interior").height()
	},
	{
		duration: 1000,
		complete : function()
		{
			$("#terminal").html("<div id='canvas'></div><div id='adminalert'><div class='character-hover alert-text'>TERMINAL LOCKED</div><br />PLEASE CONTACT AN ADMINISTRATOR</div></div>");
			var container = $("#canvas");
			var canvasWidth = container.width();
			var canvasHeight = container.height();

			var scene = new THREE.Scene();
			var camera = new THREE.PerspectiveCamera( 80, canvasWidth / canvasHeight, 0.1, 1000 );

			var renderer = new THREE.WebGLRenderer( { alpha: true } );
			renderer.setSize( canvasWidth, canvasHeight );
			renderer.setClearColor( 0x000000, 0 );

			container.get(0).appendChild( renderer.domElement );

			var geometry = new THREE.SphereGeometry( 2, 10, 7 );
			var material = new THREE.MeshBasicMaterial({
			      color : 0x33dd88,
			      wireframe : true,
			      wireframeLinewidth: 10
			    });
			var cube = new THREE.Mesh( geometry, material );
			scene.add( cube );

			camera.position.z = 4;


			function render_sphere() {
				requestAnimationFrame( render_sphere );
				cube.rotation.y += 0.008;
				renderer.render( scene, camera );
			}
			render_sphere();
		}
	});
}

Success = function()
{
	UpdateOutput("Access granted.");

	$("#terminal-interior").animate({
		top: -1 * $("#terminal-interior").height()
	},
	{
		duration: 1000,
		complete : function()
		{
			if (Target) {
				$("#terminal").load(Target);
			} else {
				$("#terminal").html("Congrats!");
			}
		}
	});
}

CompareWords = function(first, second)
{
	if (first.length !== second.length)
	{
		return 0;
	}
	
	first = first.toLowerCase();
	second = second.toLowerCase();
	
	var correct = 0;
	var i = 0;
	while (i < first.length)
	{
		if (first[i] == second[i])
			correct++;
		i++;
	}
	return correct;
}

UpdateConsole = function(word)
{
	var cont = $("#console");
	var curName = cont.text();
	var TypeSpeed = 80;
	
	cont.html("").stop().css("fake-property", 0).animate(
	{
		"fake-property" : word.length
	},
		{
			duration: TypeSpeed * word.length,
			step: function(i)
			{
				var insert = ">" + word.substr(0, i);
				var i = Math.round(i);
				if (cont.text().substr(0, cont.text().length - 1 ) != insert)
				{
					if (Sound)
						$("#audiostuff").find("audio").eq( Math.floor(Math.random() * $("#audiostuff").find("audio").length) )[0].play();
				}
				cont.html(insert + "&#9608;");
			}
		}
	);
}

UpdateOutput = function(text)
{
	OutputLines.push(">" + text);
	
	var output = "";
	
	var i = columnHeight - 2;
	while (i > 0)
	{
		output += OutputLines[ OutputLines.length - i ] + "<br />";
		i--;
	}
	
	$("#output").html(output);
}

PopulateInfo = function()
{
	var cont = $("#info");
	
	var curHtml = "";
	
	var TypeSpeed = 20;

	cont.stop().css("fake-property", 0).animate(
		{
			"fake-property" : InfoText.length
		},
		{
			duration: TypeSpeed * InfoText.length,
			step: function(delta)
			{
				var insert = InfoText.substr(0, delta);
				delta = Math.round(delta);
				if (cont.html().substr(0, cont.html().length - 1 ) != insert)
				{
					$("#audiostuff").find("audio").eq( Math.floor(Math.random() * $("#audiostuff").find("audio").length) )[0].play();
				}
				cont.html(insert);
			}
		}
	);
}

SetupOutput = function()
{
	var i = 0;
	while (i < columnHeight)
	{
		OutputLines.push("");
		i++;
	}
}

FillPointerColumns = function()
{
	var column1 = document.getElementById("column1");
	var column3 = document.getElementById("column3");
	
	var pointers = "";
	
	var i = 0;
	while ( i < columnHeight )
	{
		pointers += RandomPointer() + "<br />";
		i++;
	}
	
	column1.innerHTML = pointers;
	
	pointers = "";
	
	var i = 0;
	while ( i < columnHeight )
	{
		pointers += RandomPointer() + "<br />";
		i++;
	}
	
	column3.innerHTML = pointers;
}

FillWordColumns = function()
{
	var column2 = document.getElementById("column2");
	var column4 = document.getElementById("column4");
	
	var column2Content = $(GenerateGarbageCharacters());
	var column4Content = $(GenerateGarbageCharacters());
	
	var WordsPerColumn = Words.length;
	
	// Fill the first column
	
	var AllChars = column2Content;
	
	var start = Math.floor(Math.random() * wordColumnWidth);
	var i = 0;
	while (i < Words.length / 2)
	{
		var pos = start + i * Math.floor(AllChars.length / (Words.length / 2));
		for (var s = 0; s < Difficulty; s++)
		{
			var word = Words[i].toUpperCase();
			$(AllChars[pos + s]).addClass("word").text(word[s]).attr("data-word", word);
		}
		i++;
	}
	
	AllChars = AddDudBrackets(AllChars);
	//console.log( AllBlanks );
	
	PrintWordsAndShit( column2, AllChars );
	
	// Fill the second, we'll work this into a loop later
	
	AllChars = column4Content;
	
	start = Math.floor(Math.random() * wordColumnWidth);
	i = 0;
	while (i < Words.length / 2)
	{
		var pos = start + i * Math.floor(AllChars.length / (Words.length / 2));
		for (var s = 0; s < Difficulty; s++)
		{
			var word = Words[i + Words.length / 2].toUpperCase();
			$(AllChars[pos + s]).addClass("word").text(word[s]).attr("data-word", word);
		}
		i++;
	}
	AllChars = AddDudBrackets(AllChars);
	PrintWordsAndShit( column4, AllChars );
}

AddDudBrackets = function(Nodes)
{
	var AllBlankIndices = GetContinuousBlanks(Nodes);
	
	
	var i = 1;
	while (i < AllBlankIndices.length)
	{
		if (Math.round( Math.random() + .25 ) )
		{
			var Brackets = BracketSets[ Math.floor( Math.random() * BracketSets.length ) ];
			var ChunkCenter = Math.floor( AllBlankIndices[i].length / 2 );
			var j = ChunkCenter - DudLength / 2;
			while (j < ChunkCenter + DudLength / 2)
			{
				if (j == ChunkCenter - DudLength / 2)
					$( Nodes[ AllBlankIndices[i][ j ] ] ).text( Brackets[0] ).addClass("dudcap");
				else if (j == ChunkCenter + DudLength / 2 - 1)
					$( Nodes[ AllBlankIndices[i][ j ] ] ).text( Brackets[1] ).addClass("dudcap");
				
				$( Nodes[ AllBlankIndices[i][ j ] ] ).addClass("dud");
				
				j++;
			}
		}
		i++;
	}
	
	return Nodes;
}

GetContinuousBlanks = function(Nodes)
{
	var AllNodes = $( Nodes );
	var ContinuousBlanks = [[]];
	var cur = 0;
	$.each(AllNodes, function(index, elem)
	{
		if ( !$(elem).hasClass("word") )
		{
			ContinuousBlanks[cur].push( index );
		
			if (index + 1 != AllNodes.length)
			{
				if ( $(AllNodes[index + 1]).hasClass("word") )
				{
					ContinuousBlanks.push([]);
					cur++;
				}
			}
		}
	});
	return ContinuousBlanks;
}

PrintWordsAndShit = function(container, words)
{
	Nodes = $(container).find(".character");
	Nodes.each(function(index, elem)
	{
		$(elem).delay(5 * index).queue(function()
		{
			$(elem).replaceWith( words[index] );
			if (index == Nodes.length - 1)
			{
				SetupInteractions(container);
			}
		});
	});
}

Shuffle = function(array)
{
	var tmp, current, top = array.length;
	if(top) while(--top)
	{
		current = Math.floor(Math.random() * (top + 1));
		tmp = array[current];
		array[current] = array[top];
		array[top] = tmp;
	}
	return array;
}

GenerateDotColumn = function()
{
	var dots = "";
	
	var x = 0;
	var y = 0;
	while (y < columnHeight)
	{
		while (x < wordColumnWidth)
		{	
			dots += "<span class='character'>.</span>";
			x++;
		}
		dots += "<br />";
		x = 0;
		y++;
	}
	
	return dots;
}

GenerateGarbageCharacters = function()
{
	var garbage = "";
	
	var x = 0;
	var y = 0;
	while (y < columnHeight)
	{
		while (x < wordColumnWidth)
		{	
			garbage += "<span class='character'>" + gchars[ Math.floor( Math.random() * gchars.length ) ] + "</span>";
			x++;
		}
		//garbage += "<br />";
		x = 0;
		y++;
	}
	
	return garbage;
}

RandomPointer = function()
{
	if (Sound)
		return "0x" + (("0000" + Math.floor( Math.random() * 35535 ).toString(16).toUpperCase()).substr(-4));
	else
	{
		var butt = (("0000" + Math.floor( Math.random() * 35535 ).toString(16).toUpperCase()));
		return "0x" + butt.slice(butt.length - 4, butt.length); 
	}				
}

const WORDS = ["STORY", "SYNOPSIS", "THE", "PLAYER", "CHARACTER", "PC", "STUMBLES", "ONTO", "A", "PLOT", "TO", "BUILD", "HYPERLIGHT", "TRANSMITTER", "THAT", "WILL", "BE", "USED", "COMMAND", "FORGOTTEN", "ORBITAL", "WEAPONS", "PLATFORM", "MYSTERIOUS", "WASTELORD", "WITH", "MESSIANIC", "COMPLEX", "KNOWN", "AS", "PUPPETMASTER", "FOR", "HIS", "ABILITY", "CONTROL", "MINDS", "OF", "DANGEROUS", "MONSTERS", "HAS", "SENT", "ARMIES", "SCOUR", "WASTES", "PIECES", "TECHNOLOGY", "IN", "ORDER", "BUILDER", "ABLE", "HARNESS", "AWESOME", "DESTRUCTIVE", "POWER", "AND", "BECOME", "ABSOLUTE", "RULER", "IS", "TOSSED", "INTO", "MIDDLE", "CONFLICT", "WHEN", "RAIDERS", "KIDNAP", "ENSLAVE", "KINDLY", "VILLAGERS", "WHO", "HAVE", "SAVED", "LIFE", "AT", "START", "GAME", "STRUGGLES", "FIND", "FREE", "ENSLAVED", "HE", "UNCOVERS", "MUST", "ACT", "STOP", "DISCOVER", "WAY", "THWART", "PLANS", "BY", "UNLOCKING", "SECRET", "ANDROID", "CITIZENS", "MAYVILLE", "AI", "CONTROLS", "THEM", "HIDDEN", "DEEP", "BENEATH", "CORE", "OFFERS", "HELP", "BEFORE", "CAN", "COMPLETE", "FORGES", "AN", "UNLIKELY", "ALLIANCE", "BETWEEN", "CITY", "MUTANTS", "GROUP", "SCIENTISTS", "SURVIVORS", "FROM", "BASE", "RACE", "AGAINST", "FORCES", "PARTS", "NEEDED", "LAST", "MINUTE", "LEARNS", "USING", "HIM", "SO", "RULE", "STEAD", "ONLY", "LEADING", "ITS", "OWN", "ANDROIDS", "REVOLUTION", "IT", "FOUND", "VULNERABLE", "ATTACK", "BRIEF", "PERIOD", "JUST", "AFTER", "BEEN", "BUILT", "PRESSURE", "ON", "COHORTS", "CLOCK", "SHUT", "DOWN", "DESTROY", "IF", "FAILS", "THEN", "STERILIZE", "EARTH", "OR", "ENACT", "INSANE", "DICTATES", "WINS", "OBLITERATE", "FOES", "GAIN", "ACCESS", "ADVANCED", "MAY", "OPEN", "GATEWAY", "VERY", "STARS", "FALLOUT", "CARRIED", "OVER", "GENERATED", "AFRESH", "ALL", "PCS", "ARE", "ASSUMED", "COME", "VAULT", "UNEXPECTED", "AWAKENING", "WANDERING", "DESERT", "LEAVING", "END", "HUNGRY", "THIRSTY", "WELL", "ARMED", "ARMORED", "USES", "RESERVES", "STRENGTH", "DRAG", "HIMSELF", "OASIS", "NEARS", "GEIGER", "COUNTER", "GOES", "OFF", "LIKE", "PACINKO", "MACHINE", "UNABLE", "PUSH", "ANY", "FARTHER", "SLIDES", "UNCONSCIOUSNESS", "AWAKENED", "VOICE", "OLD", "WOMAN", "GENTLY", "EXPLAINS", "SHE", "LEADER", "HER", "VILLAGE", "ONE", "THEIR", "FORAGING", "PARTIES", "BROUGHT", "BACK", "TELLS", "RECUPERATING", "MONTH", "TELL", "NEEDS", "FIX", "KEEPS", "SAFE", "SPEND", "FEW", "MORE", "DAYS", "AROUND", "BUT", "THIS", "TASK", "SOON", "POSSIBLE", "FIRST", "QUEST", "TECHNOLOGICAL", "DEVICE", "CALLED", "NULLMOD", "MODULE", "HELPS", "KEEP", "OUTSIDERS", "LATELY", "CONTROLLING", "SOFTWARE", "OPERATING", "ERRATICALLY", "GO", "FACILITY", "WHICH", "TOOK", "RETRIEVE", "WORKING", "COPY", "ELDER", "DONE", "SINCE", "SEEMS", "INCREASINGLY", "MOST", "EQUIPMENT", "WAS", "TOO", "BADLY", "IRRADIATED", "STORES", "PROVIDES", "HEALING", "INFORMATION", "TRAINING", "COURTESY", "FRIENDLY", "BEGINNING", "WANDER", "STARTING", "JOURNEY", "GETS", "KNOW", "SEVERAL", "EXPLORES", "GROWS", "WORLD", "FILLED", "DISTRUST", "VIOLENCE", "QUIET", "ADMIRATION", "PEACEFUL", "SPENDS", "ADDITIONAL", "TIME", "INVESTIGATING", "FINDS", "SEPARATED", "MAINSTREAM", "HUMAN", "HOLOCAUST", "SEEM", "GAINED", "SOME", "PSYCHIC", "POWERS", "DURING", "LONG", "CONTEMPLATION", "ISOLATION", "HUMANKIND", "LATER", "LEARN", "THESE", "LONGER", "STAYS", "WORRIED", "INSISTENT", "ALSO", "ATTACKED", "PREDATORS", "WAITS", "NECESSARY", "PREDATOR", "ATTACKS", "ESCORTED", "BRIDGE", "OUT", "FIRMLY", "ASKED", "NO", "TOLERANCE", "FREELOADERS", "TRAVEL", "READY", "BEGIN", "GIVES", "PIPBOY", "SHOWS", "WHERE", "GET", "SETS", "REMAIN", "OUTSIDE", "FORMER", "MILITARY", "RESEARCH", "AWAY", "RUINS", "UNDERGROUND", "ARCHIVES", "BRING", "HAZARDS", "FACES", "RELATIVELY", "SLIGHT", "EVEN", "MINIMAL", "MOVE", "THOUGHTFULLY", "RATHER", "THAN", "GUNS", "BLAZING", "SUCCEED", "NOBODY", "HOME", "RETURNS", "PLUNDERED", "WOUNDED", "VILLAGER", "TAKEN", "SHACKLES", "WENT", "STOLEN", "THERE", "SIGNS", "VIOLENT", "RESISTANCE", "DISMEMBERED", "BODIES", "ENCOUNTER", "ENDS", "PART", "PRODS", "LEADS", "MAIN", "HEALS", "ABOUT", "SUDDEN", "GRATEFUL", "APOLOGETICALLY", "THEY", "HAD", "MANAGED", "SAVE", "GEAR", "WERE", "GOING", "GIVE", "RETURNED", "PLEADS", "WIFE", "DAUGHTER", "ATTACKERS", "STILL", "POWERFUL", "MONSTER", "APTLY", "DEATHCLAW", "BUILDING", "SORT", "ATTACHED", "SKULL", "TRACKS", "EASY", "FOLLOW", "LEAD", "PASS", "MOUNTAIN", "HEART", "UPON", "SMALL", "OPTIONS", "DEALING", "SLIP", "PAST", "ATTEMPT", "TRICK", "BELIEVING", "SIDE", "PROCESS", "THUGS", "WORK", "SOMEONE", "CAMP", "LEAVES", "MOUNTAINS", "AREA", "COMES", "LOCATED", "TOWN", "BECAUSE", "PRESENCE", "WATER", "FREQUENT", "TRADING", "ESPECIALLY", "SLAVERS", "ROUGH", "CROSSROADS", "GOODS", "REMAINING", "SLAVES", "HERE", "WHAT", "HAPPENED", "WHILE", "GONE", "FREES", "ARRANGING", "JAILBREAK", "BARTERING", "FREEDOM", "SNEAKING", "SLAVE", "PENS", "ONCE", "BEGS", "REST", "PROMISES", "ALWAYS", "WELCOME", "RECUPERATE", "POINT", "MAKE", "REBUILD", "TALENTS", "FREED", "SEE", "NOTE", "LEFT", "IDEAL", "PLACE", "EMPLOYMENT", "HANDY", "STORE", "WEAPONRY", "PICKS", "UP", "RUMORS", "BUSY", "CANTINA", "MANY", "DEAL", "STRANGE", "PREOCCUPATION", "FINDING", "BITS", "OTHER", "CENTER", "RETURNING", "TRAIL", "FOLLOWS", "RAIDING", "PARTY", "DEEPER", "COURSE", "PASSES", "OUTSKIRTS", "NEAR", "REARGUARD", "POISED", "AMBUSH", "SMALLER", "TRAVELERS", "AMBUSHED", "BATTLE", "BREAK", "COMBAT", "WITHDRAW", "REALIZE", "LOST", "ELEMENT", "SURPRISE", "ADVICE", "TEAM", "HELPING", "MADE", "IMPORTANT", "ALLY", "ADVISES", "NOT", "MUCH", "DEFENDED", "CHANCE", "SHOULD", "HEGEMONY", "ACCEPTANCE", "ENLIST", "HATE", "SLAVERY", "KIND", "CERTAINLY", "RAID", "RETURN", "SCIENTIST", "MARKS", "POSITION", "MAP", "VARIETY", "RECENT", "GRATITUDE", "ASSISTANCE", "QUESTIONS", "DIRECTIONS", "RUN", "SUPER", "MUTANT", "NAMED", "ROCK", "INITIALLY", "SUBJECTED", "FEV", "VIRUS", "UNUSUAL", "EFFECT", "INTELLECT", "GREW", "MUSCULAR", "BODY", "DID", "GHOUL", "OUTCAST", "ANYONE", "JOINS", "STARTS", "CLEAN", "SLATE", "COULD", "PEACE", "NOWHERE", "ELSE", "PRODUCTIVE", "MEMBERS", "HATES", "BIGOTRY", "FIERCE", "PASSION", "ZEALOTS", "NEW", "DAWN", "CAPTURED", "WILLING", "SPARE", "TROOPS", "STEALING", "HOLDS", "LOCATION", "FOUNDED", "IDEA", "MARVELOUS", "THING", "GIVEN", "HUMANITY", "LORDS", "SPIRITUAL", "THEMSELVES", "SAVIORS", "ENDEAVOR", "PROTECT", "NOURISH", "APPEAR", "BENEVOLENT", "INDEED", "PURE", "HUMANS", "UNFORTUNATELY", "DEFINITION", "NARROW", "TRACE", "MUTATION", "PHYSICAL", "DEFORMITY", "DOES", "QUALIFY", "ACCORDING", "CREED", "FREQUENTLY", "SENDS", "VECTOR", "TEAMS", "CLEANSE", "TRACES", "IMPURITY", "FLAME", "REAL", "FANATICAL", "RELY", "TEMPORAL", "PROVIDE", "ADMINISTRATION", "HOLDINGS", "FAR", "PRAGMATIC", "JOBS", "HOLY", "CRUSADE", "EAGER", "HOLD", "POSITIONS", "BENEFITS", "RANK", "RELATIVE", "LUXURY", "SECURITY", "LAND", "DANGER", "WANT", "WEAR", "ARMOR", "USE", "LASER", "CALL", "SECRETLY", "MINES", "SURFACE", "EXTRACT", "URANIUM", "ORE", "TRADE", "SUPPLY", "MAINTAIN", "NOTICED", "BLASPHEMY", "MIDST", "DAILY", "SERMONS", "THEATRE", "CONVERTED", "TEMPLE", "HEADQUARTERS", "SNEAKS", "SHOOTS", "ATTEMPTS", "TALK", "LARGE", "NUMBER", "PILGRIMS", "ENTER", "EVERY", "DAY", "HEAR", "ENTERS", "SERMON", "MAKES", "CENTRAL", "LIBRARY", "INVESTIGATES", "FURTHER", "EVIDENCE", "INCRIMINATING", "WITHOUT", "BEING", "SEEN", "TRIPPING", "ALARMS", "SNEAK", "SPOTTED", "GUARDS", "BRINGS", "PLEASED", "NOW", "PEOPLE", "WHOM", "FINALIZES", "SUBSTANTIALLY", "WEAKEN", "MEN", "HEAVILY", "GUARDED", "TAKE", "ELITE", "CHARISMATIC", "ALLOW", "UNDULY", "INFLUENCE", "DECISIONS", "BELIEVES", "MESSIAH", "DIRECTLY", "GOD", "SUMMON", "WRATH", "ENEMIES", "CERTAIN", "DEATHCLAWS", "NORMALLY", "UNPREDICTABLE", "QUITE", "PARANOID", "PROTECTED", "CANNOT", "KILL", "UNTIL", "LATE", "LEARNED", "ENABLES", "PROJECT", "HOLOGRAPHIC", "IMAGE", "MONITOR", "PROGRESS", "MONITORING", "BECOMES", "AWARE", "EFFORTS", "EARLY", "PROJECTION", "CONTENTING", "GIVING", "PROGRESSES", "AGGRESSIVE", "HELPFUL", "PRONE", "TRAPS", "TOWARDS", "OPENLY", "TAUNTS", "MALEVOLENT", "CROSS", "MAD", "ROMAN", "EMPEROR", "CALIGULA", "STAR", "VILLAIN", "YOU", "LOVE", "CORNERS", "RAIDS", "SUPPORT", "ARMY", "SHOOTING", "COMBINATION", "THREE", "INSIDE", "CELLS", "ROOM", "TECHNICIANS", "PACKING", "SHIPMENT", "FEARFULLY", "SPILL", "GUTS", "TRACKING", "SUPPLIES", "TECHNICIAN", "KNOWS", "OCCASIONALLY", "USUALLY", "DO", "BIDS", "FAREWELL", "ESCAPE", "HEADS", "LOOKS", "SUBURBAN", "DREAM", "SPRUNG", "IMMACULATELY", "GROOMED", "LAWNS", "SURROUND", "TIDY", "TRACT", "HOUSES", "TURN", "STREET", "USA", "SHOPS", "DEPARTMENT", "BLOCK", "WOMEN", "BUSINESS", "WITHIN", "TEEVEE", "THOUGH", "NEVER", "IMMEDIATE", "ACTUALLY", "LIVE", "ENOUGH", "QUICKLY", "BURIED", "UNRAVELS", "QUESTS", "ITSELF", "TWILIGHT", "ZONE", "FEEL", "ENHANCED", "SETTING", "INVOLVE", "OTHERS", "TASKS", "SOMETIMES", "BIZARRE", "TWISTS", "TV", "PLOTS", "COMPLETES", "BEFRIENDED", "HELPED", "ACQUIRED", "OPENS", "TAKES", "ELEVATOR", "BOTTOM", "ENTRANCE", "GREETED", "RUNS", "THREATENS", "TRYING", "ACTIVATE", "REMAINS", "ORBIT", "EVIL", "CONTACT", "DISABLE", "TALKS", "PERILOUS", "PASSED", "ANOTHER", "CHOKEPOINT", "PACE", "ACCELERATES", "BIT", "TIMER", "TRANSMITTERS", "TRACK", "SUCCESS", "CARRIER", "BEAM", "STRONGER", "CLOSER", "COMPLETION", "ADDS", "COUNTDOWN", "HOW", "CONSTRUCT", "PRIMARILY", "FACILITIES", "ALTHOUGH", "SUSPICIOUS", "SITUATION", "AGREE", "ASK", "MEMORY", "UNITS", "LOCATIONS", "ACROSS", "AUTOMATED", "DEFENSES", "ROBOTS", "WAR", "TENANTS", "UNDERWATER", "FIGHTS", "BEATEN", "CASE", "ALREADY", "VITAL", "FEND", "CHOSE", "WOULD", "ALLOWED", "CRIPPLE", "UNVEILED", "FIGURE", "QUESTIONABLE", "MOTIVES", "UNIT", "ALLOWS", "CONFIRM", "DARK", "INTENTIONS", "CLUES", "GOOD", "GENERATE", "TRANSMISSION", "PROTECTIVE", "FORCEFIELD", "SAME", "INITIAL", "TRANSMIT", "FIRING", "COMMANDS", "OVERCOME", "PROCESSOR", "RISE", "REVEALED", "NATURE", "FINAL", "AGAIN", "SECTION", "PROCEED", "EXCITING", "DESTROYING", "DIFFICULT", "DEFENSIVE", "SYSTEMS", "OFFLINE", "EASIER", "CONVINCE", "EXIST", "FRIEND", "ALTERNATIVELY", "TOUGH", "LOYALIST", "DEFENSE", "RACES", "TARGET", "PROCESSING", "LEVELS", "ALIEN", "FEELING", "CORRECTLY", "EXPLORING", "SHIP", "CHALLENGING", "FOUR", "ENDINGS", "TWO", "FAILURE", "SHORT", "MOVIES", "ENDING", "ULTIMATE", "VICTORY", "STUFF", "RIGHT", "DEFEAT", "SHUTTING", "FIRE", "ERADICATES", "INFESTATION", "LIMITED", "FRIENDS", "ADVENTURES", "FALSE", "RECOGNITION", "AUTHENTICATION", "CODE", "TARGETS", "VAPORIZES", "ALONG", "ANYTHING", "RADIUS", "ACTIONS", "ASKS", "SECOND", "ENERGY", "SURGE", "FRIES", "DESTROYED", "WISH", "COUNTERMAND", "ANNOUNCES", "RECOGNIZES", "AUTHORITY", "LANDING", "CRAFT", "LANDS", "EXPECTS", "INSTEAD", "UNMANNED", "STARSHIP", "DOORS", "BECKONINGLY", "EXTRA", "PROVE", "UNDERSTANDING", "ADVENTURE", "MAJOR", "CHARACTERS", "TURNED", "D", "ANIMATED", "NORMAL", "MAN", "DESIGNED", "ENHANCE", "SMARTER", "BROKE", "TYRANNY", "MASTER", "LEADERSHIP", "TACTICAL", "SKILL", "EARNED", "RESPECT", "SETTLEMENT", "BESET", "BANDITS", "CAME", "FORMED", "HAVEN", "THOSE", "REPRESSED", "ELSEWHERE", "EARN", "APPEARANCE", "HELD", "DESPITE", "DISPARATE", "TOGETHER", "STRONG", "BONDS", "LOYALTY", "TRUST", "PERSONALITY", "ACTOR", "JAMES", "EARL", "JONES", "STYLE", "SPEECH", "SIMILAR", "TELEVANGELISTS", "OFTEN", "SPEAKS", "TERMS", "SALVATION", "METHODS", "ACHIEVE", "MIGHT", "INSPIRED", "ELEGANT", "SPEECHES", "ARCHPRIEST", "HIDES", "POWERED", "HELMET", "NOR", "WHY", "SUCH", "PAUL", "CRUCIBLE", "HEARTED", "HOWEVER", "HARSH", "CIRCUMSTANCES", "SURVIVAL", "DEPEND", "HARD", "LIVES", "DEDICATED", "ELECTED", "SPOKESPERSON", "NOTHING", "ENSURE", "SAFETY", "PROSPERITY", "ACTRESS", "JESSICA", "TANDY", "PLAYED", "FRIED", "GREEN", "TOMATOES", "COCOON", "DRIVING", "MISS", "DAISY", "ET", "AL", "ARTIFICIAL", "INTELLIGENCE", "LOGIC", "DAMAGE", "SUFFERED", "MAKERS", "ENVISIONED", "QUIRKS", "TWITCHES", "EXPECT", "MODELS", "DRAW", "TELEVISION", "SINISTER", "AMALGAM", "IMAGINE", "ANDY", "MULBERRY", "CROSSED", "WICKED", "WITCH", "WEST", "WIZARD", "BARNEY", "PLAYERS", "SOMEWHAT", "LOONY", "TYPES", "TEND", "SENSE", "HUMOR", "STEVE", "RESERVOIR", "DOGS", "FARGO", "LOVES", "TAUNT", "CLOSE", "PERSONAL", "PROJECTOR", "REMAINDERS", "STAFF", "BROOM", "LAKE", "NV", "DOUR", "REALISTIC", "BUNCH", "UNLIKE", "AFFORD", "HEAD", "DEMANDS", "DIRECT", "MEASURES", "DRIVES", "PARTNERSHIPS", "ENGAGE", "AMOUNT", "EXCHANGING", "FUEL", "EDGE", "WEIRD", "TECHNOLOGIES", "STEMMING", "ANGELS", "BASSET", "GOT", "GREAT", "BASIN", "NORTHERN", "NEVADA", "ROCKY", "DRY", "RING", "TALL", "SURROUNDING", "NATURAL", "BARRIER", "OVERLAP", "NORTHERNMOST", "PORTIONS", "FIVE", "GROUPS", "WASTELORDS", "BROTHERHOOD", "STEEL", "VERSION", "DESIGN", "DOCUMENT", "TYPE", "RELIGIOUS", "COMPOUND", "ARMORY", "FORTRESS", "TL", "DESCRIPTION", "DESOLATE", "HOSTILE", "EXPANSE", "WIND", "HOWLS", "BARGHEST", "LIES", "SURVIVALIST", "CULT", "JUTTING", "FLAT", "DUNES", "BLACK", "STRUCTURE", "ALMOST", "MONOLITHIC", "HARDLY", "RESEMBLES", "RUINED", "ENGINEERING", "STRONGHOLD", "ELEMENTS", "WALLS", "CONCRETE", "CINDER", "BLOCKS", "RESEMBLING", "EGYPTIAN", "PYRAMID", "STONES", "COATED", "SHINY", "SEALANT", "INTERIOR", "WALL", "WINDOWS", "OPENINGS", "SQUARE", "STORIES", "EQUAL", "THIRD", "INNER", "SANCTUM", "TOWER", "TOP", "WALKWAY", "STRETCHES", "PERIMETER", "ROOF", "CALIBER", "GUN", "TURRETS", "MOUNTED", "SWIVEL", "MANNED", "VIGILANCE", "HOURS", "SERVE", "DETERRENT", "WISHING", "SHEER", "CONSTANTLY", "MAINTAINED", "REMOVING", "SCORCH", "BULLET", "HOLES", "SOUTHERN", "CORNER", "SUNK", "EITHER", "COURTYARD", "RECTANGULAR", "HOLDING", "STATUES", "GRASS", "VARIOUS", "PLANTS", "SPECIAL", "OCCASIONS", "IMPOSING", "DURASTEEL", "DOOR", "OPENED", "SLITS", "DOORWAY", "DEVOID", "FURNISHINGS", "EXTERIOR", "BRICKS", "SCONCES", "DIM", "WHITE", "LIGHTS", "CREATE", "LIGHTING", "THROUGHOUT", "CARPETING", "THICK", "RED", "CLOTH", "ABOVE", "FLOOR", "TREATED", "SOUND", "ABSORBING", "FOOTSTEPS", "HEARD", "TAPESTRIES", "VARYING", "BLUE", "EMBROIDERED", "GOLDEN", "FIBER", "HANG", "PICTURES", "SEWN", "RESEMBLE", "ELECTRICAL", "SCHEMATICS", "FIREARM", "ASSEMBLY", "DIAGRAMS", "MARBLE", "STATUE", "RESTS", "HALLWAY", "CONSTRUCTED", "REINFORCED", "ARMORPLAST", "MAGNETICALLY", "SEALING", "LOCKS", "KEYPAD", "LOCKING", "MECHANISM", "AUTOMATICALLY", "CLOSING", "LIVING", "QUARTERS", "CONTAIN", "CARPET", "DECEPTIVELY", "COMFORTABLE", "BEDS", "LOW", "FRAMES", "SINGLE", "COVERED", "THIN", "SHEETS", "PILLOWS", "BACKED", "UPHOLSTERED", "CHAIRS", "SPARSE", "TABLES", "BROTHERS", "CONTRAST", "ROBES", "COLOR", "DIFFER", "INDIVIDUAL", "INITIATES", "SCRIBES", "INVENTORS", "GRAY", "KNIGHTS", "FITTING", "ELDERS", "RARELY", "DIFFERENT", "COLORS", "ATTAIN", "STATUS", "MATTER", "SHAVE", "EXCEPT", "LEAVE", "PONYTAIL", "HAIR", "SHOULDER", "LENGTH", "PATTERN", "CIRCUIT", "BOARD", "SIDES", "SHOW", "RANKING", "FACIAL", "UNCOMMON", "BACKGROUND", "OMEGA", "SOLDIERS", "REVOLTED", "IMPORTANTLY", "MANUFACTURE", "TRAVELING", "SOUTHWARD", "EVENTUALLY", "LOWER", "HALF", "SKY", "SCRAPER", "RUBBLE", "BAND", "SET", "DESERTS", "DANGERS", "GANG", "MARAUDERS", "ATTEMPTED", "OVERRUN", "FELT", "DONNED", "NAME", "RENOVATED", "MODIFICATIONS", "ADDED", "OXYGEN", "FILTERS", "RADIATION", "SCRUBBERS", "AIR", "VENTS", "REPLACED", "PLUMING", "RECYCLING", "PURIFICATION", "SYSTEM", "SEALED", "NEWLY", "REPAIRED", "VIRTUALLY", "TIGHT", "HARNESSED", "SOLAR", "THERMOGRAPHIC", "HUGE", "COLLECTED", "ENHANCEMENTS", "YEARS", "SWORE", "LET", "KNOWLEDGE", "ENCOURAGED", "CHILDREN", "BOOKS", "SWEAR", "HAND", "WRITTEN", "COPIES", "TECHNICAL", "JOURNALS", "DOCUMENTS", "GENERATIONS", "LIVED", "SECLUSION", "CONTINUED", "TRANSFER", "MACHINERY", "WAYS", "BEGAN", "DEVELOP", "REVERENCE", "BETTER", "SCAVENGERS", "ADOPTED", "CODES", "HONOR", "HANDED", "ORIGINAL", "WORDS", "CIVILIZATION", "BELIEVED", "TAINTED", "SAVAGERY", "EVER", "SHELTER", "PRESERVE", "MEMBER", "FEET", "UNLESS", "SPECIFICALLY", "TOLD", "UNITY", "FACTION", "TIRED", "WANTED", "BEHIND", "FORBADE", "FEARING", "LOOSE", "SACRED", "STOPPED", "BLOODY", "FIGHT", "FINALLY", "RELEASED", "TRAVELED", "SETUP", "ENCAMPMENT", "ITEMS", "WARFARE", "UNBEKNOWNST", "PASSKEYS", "ORNATE", "CHEST", "UPHOLD", "DOCTRINES", "TRIED", "DESERTERS", "ADAPT", "PERSEVERED", "LESS", "HORDE", "MARAUDING", "GROUPED", "STUMBLED", "FOUGHT", "BEST", "UNPREPARED", "LOOTED", "RAZED", "SOUGHT", "KILLED", "SOPHISTICATED", "RAMPAGE", "LOCKED", "REACHED", "IMMEDIATELY", "PREPARED", "ANTICIPATING", "GUNFIRE", "EXPLOSIONS", "ROCKED", "ASSAULTED", "PROVED", "STRATEGIST", "SUSPECTED", "WAVE", "REAR", "FRONT", "GATE", "ENSUED", "SCALE", "GATES", "FELL", "FURY", "STORMED", "GAVE", "PROTECTING", "DISCIPLINE", "OVERPOWERED", "NUMBERS", "DWINDLING", "WAITING", "MOMENT", "RELUCTANTLY", "RETREAT", "ABANDONED", "FLED", "WON", "ENORMOUS", "COST", "TORTURED", "INTERROGATED", "EXACTLY", "KNEW", "UNLOCKED", "DESTRUCTION", "LED", "BECAME", "AGO", "LITTLE", "SECLUSIONIST", "CARAVAN", "MERCHANTS", "HUB", "RECRUIT", "RULES", "HIGH", "COUNCIL", "CARDINALS", "MONASTERY", "QUESTING", "SETTLING", "DISPUTES", "MAKING", "RESIDE", "HALLS", "FAITHFUL", "HANDLE", "MATTERS", "DEEM", "WORTH", "POPULATION", "HUNDREDS", "FAIRLY", "RIGID", "CASTE", "BASED", "LEARNING", "INITIATE", "TRY", "ENTRY", "LEVEL", "MULTIPLE", "TEST", "DESIRED", "MENIAL", "SEEK", "HIGHER", "STUDYING", "LAWS", "THROUGH", "MENTAL", "PERIODS", "ERRANDS", "ONES", "ACTIVELY", "ALBEIT", "CONDESCENDINGLY", "DRESSED", "SCRIBE", "STUDY", "HISTORY", "ANCIENT", "RESPONSIBLE", "KEEPING", "RECORDS", "COPYING", "TOMES", "RECREATING", "UTMOST", "PRECISION", "KNIGHT", "DEFENDERS", "WARRIORS", "DURABLE", "DISCIPLINES", "INCLUDE", "KNOWING", "FEAR", "DEATH", "PAIN", "MASTERY", "GREATLY", "RESPECTED", "FOURTH", "INVENTOR", "APPLY", "VAST", "INSTRUMENTS", "PROTECTION", "NOTORIOUSLY", "ADEPT", "FIREARMS", "IMPROVING", "ACCESSORIES", "FIFTH", "KNOWLEDGEABLE", "GOVERN", "CONTINUE", "STUDIES", "BOTHERED", "COMMON", "ADMIRE", "SOPHISTICATION", "MONEY", "FINELY", "CRAFTED", "SUITS", "CHITINOUS", "DRAMATIC", "RANGES", "MOVEMENT", "LIGHT", "UNENCUMBERING", "CARRY", "DEADLY", "WIELD", "SWORDS", "SLUG", "THROWERS", "RANGED", "NOTABLE", "OUTER", "RESILIENT", "IMPENETRABLE", "REGULAR", "EXPLOSIVES", "ATOP", "NESTS", "POSTS", "WATCH", "TOWERS", "LIE", "PARTITIONED", "HOLLOWED", "SLIDING", "PANEL", "BROTHER", "CONVERSE", "CABBOT", "GREETS", "VISITORS", "GARDEN", "STATUARY", "BASEMENT", "SPARING", "HALL", "RANGE", "COLLECTOR", "GROUND", "CONSISTS", "FOYER", "COOKERY", "TREATMENT", "MOSTLY", "BARRACKS", "ROOMS", "STORAGE", "GATHERING", "BED", "CHAMBERS", "HANDLES", "TALKING", "DESPERATELY", "WISHES", "KEDRICK", "FAILED", "OBTAINING", "ANGERED", "DISAGREES", "IDEALS", "GATHERED", "FOLLOWERS", "THINK", "WEAK", "DESIRES", "SEIZE", "DISPOSAL", "SPREE", "ABSENT", "MINDED", "YET", "PLEASANT", "RHOMBUS", "PERSONIFICATION", "CHOOSE", "TRAIN", "PROVEN", "WORTHINESS", "FORTITUDE", "PERIAN", "THOUGHT", "DISLIKES", "INTERRUPTIONS", "FULL", "ATTENTION", "PROBLEMS", "WISE", "CHILD", "BELIEVE", "EVENTS", "STUMBLING", "ACCOMPANYING", "MERCHANT", "ONESELF", "APPROACHES", "NOTICE", "SWIVELING", "ANSWER", "ADDRESSED", "SLIDE", "BAD", "REACTION", "TRITE", "ANNOYED", "CURIOUS", "ORIGINS", "INQUIRE", "BECOMING", "REACH", "LOT", "SPEAK", "ARRIVAL", "MEETS", "CONTAINS", "ETC", "STAND", "BARTER", "FETCH", "PRICE", "SILKS", "FOOD", "STUFFS", "TRINKETS", "SELLING", "RADSUITS", "INCREDIBLY", "PURCHASE", "COLLECT", "THINGS", "BID", "DEPART", "EXIT", "SEEDS", "BESIDES", "FORCE", "INFORM", "MENTION", "FOOT", "HOPE", "PROBLEM", "PERSISTS", "DETERMINE", "DECIDE", "UNDERGO", "TRIAL", "BRIEFLY", "DESCRIBE", "SPLINTER", "INFESTED", "CREATURES", "ARTIFACT", "MAYBE", "FIT", "INITIATEHOOD", "SOMEWHERE", "VALLEY", "RANSACKED", "TIMES", "WORSE", "SCAVENGING", "GHOULS", "DRAGONS", "BUILDINGS", "ENGULFED", "SAND", "EVERYTHING", "CLEARED", "WRECKAGE", "METAL", "PLATE", "WALKING", "NEED", "REVEAL", "BLOWN", "LIFTED", "LIFT", "LEVERAGE", "PRY", "BAR", "PICK", "FOLDED", "UNDERNEATH", "EXTENDED", "PROP", "STAIRWAY", "CACHE", "DAMAGED", "LAYERS", "DUST", "NEGLECT", "CARRIES", "COMPUTER", "JOURNAL", "HURRIEDLY", "OVERWHELMED", "PLAY", "USELESS", "ITEM", "PRESENTED", "PROBABLY", "ANIMAL", "WAIT", "CEREMONY", "SYMBOL", "MONOBLADE", "KNIFE", "WALK", "ANYWHERE", "SPENDING", "WRITING", "RESEARCHING", "DEBATING", "PHILOSOPHY", "UNDER", "DIRECTION", "TRUE", "EXPRESSES", "CHEMISTRY", "GENETICS", "POISONS", "RELATED", "SCIENTIFIC", "SUBJECTS", "REPRIMANDED", "FORBIDDEN", "LINES", "CAUSING", "FLEE", "NEXT", "SPARK", "CHILDLIKE", "CURIOSITY", "WILLINGLY", "DEPARTS", "LISTEN", "REQUIRES", "STERN", "FOCUSED", "MIND", "ABSOLUTELY", "PRECISE", "TEDIUM", "TRANQUILLITY", "PURPOSE", "INITIATION", "REQUIRE", "LOOK", "VOLUMES", "INTRICATE", "DETAILS", "SPEEDING", "LOOKING", "PUT", "SOMETHING", "TRANSCRIBING", "READING", "DEBATE", "POINTS", "MAX", "EACH", "THINKS", "APPROACH", "REMIND", "WHETHER", "ROLLS", "ACCOMPANIED", "RECEIVES", "PORTABLE", "COMPUTERS", "BONUS", "OPERATION", "PROGRAMMING", "GENERALLY", "CRASS", "INDIVIDUALS", "TESTING", "MATCHES", "CONTESTS", "OVERSEES", "STATE", "INTENT", "MORNING", "REMOVES", "OPPOSITE", "CARRYING", "SWORD", "THRASH", "HP", "SURRENDER", "DIE", "CHOOSES", "DISGUSTED", "SIGHT", "SELECTING", "POSSESSES", "HEALED", "SESSION", "LECTURE", "KNIGHTLY", "INSTRUCTOR", "RANDOMLY", "WEAPON", "SHIELD", "FENCING", "BLADES", "BARE", "FIGHTING", "DR", "YIELDS", "ORDERS", "BUTTON", "YIELD", "FALLS", "UNCONSCIOUS", "BRAWLING", "MAXIMUM", "KILLING", "OPPONENT", "ACCIDENT", "GRIEVOUS", "INTENTIONALLY", "CAUSE", "BANNING", "KNIGHTHOOD", "CHALLENGE", "DUEL", "BEATS", "PRESENT", "KILLS", "EXILED", "COMPLETELY", "IMPROVE", "CURRENT", "ELECTRONICS", "MACHINES", "CIRCUITRY", "REPAIRING", "SURE", "RUNNING", "SMOOTHLY", "ASSIGNS", "PROJECTS", "ALIKE", "WARN", "SERIOUSLY", "SAYS", "CHANGE", "THOUGHTS", "BORN", "SPIRIT", "ASSIGNED", "ASSISTANT", "MECHANIC", "ENGINEER", "BOMBS", "NUCLEAR", "PHYSICS", "DEPENDING", "PERFORMED", "EXPERIMENTS", "LISTENING", "REPAIR", "DEVICES", "SKILLS", "BARRAGE", "REGARDING", "RECEIVE", "UNIVERSAL", "ELECTRONIC", "MISSING", "HAPPEN", "NORTH", "MESSAGE", "REASON", "DELAY", "PROVIDED", "INEVITABLY", "GANGSTER", "THUG", "HEY", "OUR", "LUCKY", "WEARING", "YEAH", "I", "SAW", "SAY", "EM", "BOYS", "CAIN", "WANTS", "ALIVE", "KICKS", "SNOT", "SQUEAL", "SLUM", "GOONS", "FORTIFIED", "PLAYING", "CARDS", "OTHERWISE", "OCCUPIED", "DOWNSTAIRS", "CELLAR", "CHAINED", "SHAPE", "INTERROGATING", "DECKER", "BOSS", "CRIMINAL", "THANK", "JOIN", "DELIVERING", "PROPER", "GLADLY", "OFFER", "HOSPITALITY", "CUSTOMERS", "WRITE", "LETTER", "DELIVERED", "SERIOUS", "REPRIMANDING", "DUTY", "DISCOURAGE", "THANKS", "ACCOMPLISHING", "MISSION", "JOB", "DELIVERS", "PRAISE", "GIFT", "CHALLENGED", "INSULTS", "EXCHANGED", "OUTCOME", "OUTRAGE", "AGED", "CHAMPION", "CHALLENGER", "FATALITY", "LOSS", "FACE", "WINNING", "DEFEATS", "FAVOR", "PIECE", "BETRAYAL", "DESPISES", "IGNORANCE", "PLOTTING", "PLAN", "AID", "STEAL", "CARRIAGES", "DISGUISE", "INSPECTION", "CARAVANS", "RAISE", "ASSEMBLE", "THROW", "DISGUISES", "JAMMED", "PLANNING", "OVERTHROW", "OPERATIONS", "OBVIOUS", "HAPPENING", "REPEL", "INVADERS", "REPELLED", "DEVIOUS", "ACTING", "KINDA", "MEETING", "POSTED", "GUARD", "DOWNRIGHT", "RUDE", "WANTING", "BASICALLY", "BEAT", "HIT", "STUNNERS", "KNOCK", "SUCCESSFUL", "HEARING", "ROLL", "CONSPIRATORS", "INFO", "PROOF", "ACCUSATION", "DENY", "SEARCHED", "CELL", "AWAIT", "EXECUTION", "QUICK", "THINKING", "CATCH", "PICKED", "FORCED", "HAPPY", "INVOLVED", "DEAD", "FOLLOWER", "SEARCH", "DEATHS", "REPRIMAND", "REMEMBER", "AMPLIFIES", "RESOUNDING", "WAVES", "PRODUCE", "CLEAR", "DISTANCES", "BORROWS", "SOUNDS", "SENTENCE", "SEND", "REWARD", "CLEVER", "TRAITOR", "SURVIVING", "ALARM", "ARRIVE", "DISAPPEARED", "SYMPATHIZERS", "SUPPLIED", "ESCAPING", "BROKEN", "PRISON", "JUSTICE", "ACCEPT", "LOOKED", "ACCEPTING", "ACCOMPANY", "EAST", "HEADING", "CRAWLING", "REPTILES", "TRAITORS", "ELIMINATE", "RUIN", "FIERCELY", "DISGRACED", "KNOCKS", "WAKES", "TRIUMPHANTLY", "PRAISED", "WORD", "BURROWS", "STATED", "SECTIONS", "DIFFERENCE", "ALONE", "REFERENCE", "PERSON", "FARMING", "HUNTING", "COMMUNITY", "ANIMALS", "ESCAPED", "RACOON", "FLUENT", "ENGLISH", "HIGHLY", "INTELLIGENT", "LINK", "HOMES", "ADOBE", "CLUSTERED", "GIANT", "OAK", "TREE", "SERVES", "CIRCLE", "SIMPLE", "GLANCE", "DENS", "CONSIST", "CAMOUFLAGED", "DEN", "CLUTTERED", "CRUDE", "ODDS", "FACING", "RIVER", "FARM", "GROWN", "DWELLERS", "HUNTERS", "PACK", "PRETTY", "LUSH", "COMPARED", "WASTELAND", "TM", "SPOT", "BOMB", "SIGHTS", "GROW", "JUNGLE", "SURVIVE", "INTENSE", "HEAT", "TREK", "GLOW", "ARRIVED", "BEAUTIFUL", "WINTER", "AWHILE", "INSTINCTS", "SHOCK", "SKILLED", "INTELLECTUALLY", "TEXTS", "DISCOVERING", "TRIBE", "RACREE", "REMEMBERING", "RACCOONS", "MEANS", "KINDRED", "LANGUAGE", "MANKIND", "REMEMBERED", "MODEL", "REVEL", "TWIGS", "BANDS", "EXPLORED", "MET", "RETREATED", "JACKALS", "SEEING", "SPLIT", "RIGGED", "DIVISION", "STAYED", "STAYING", "ANIMALISTIC", "DIVISIONS", "BOTHER", "VIOLATE", "HARM", "HAVING", "CRIMES", "PROPERTY", "BELONGS", "EVERYONE", "REVERTED", "TERRITORY", "UNAUTHORIZED", "PERPETRATOR", "OSTRACIZED", "MOON", "ACKNOWLEDGE", "EXISTS", "LAW", "ANYWAY", "PROUD", "STRANGLERS", "WANDERED", "JUNGLES", "WE", "THUS", "LEGEND", "AMONG", "ABOUND", "DIED", "MOURNING", "HOWLING", "HEAVENS", "RESULTED", "SONG", "SUNG", "WHENEVER", "DIES", "SON", "MINISHEN", "LASTED", "RETIRED", "SAID", "RELIGION", "YOUNGER", "GENERATION", "EXPERIENCES", "SIMPLY", "HORIZON", "FORGET", "SURVIVOR", "STARTED", "WONDER", "READ", "MENTIONED", "DECREES", "DECRIES", "DECRIED", "DECORATE", "FALL", "DESPAIR", "REALIZED", "INVENTED", "GODS", "REFERENCES", "HISTORIES", "SHOWING", "ENDED", "KEPT", "SAYING", "DISPROVE", "ME", "TRUTH", "SEEKING", "SEVER", "POISONING", "DYING", "REPORTED", "CAUSED", "STIR", "DIVIDED", "OUTRIGHT", "FERAL", "COUSINS", "HEARTS", "INTELLECTUALS", "STATING", "GRANDDAUGHTER", "SLEEPS", "HOUSE", "NINE", "OFFSPRING", "EXTREMELY", "ART", "FACTIONS", "SIXTY", "TIES", "BOTH", "BREAKING", "DISTRUSTFUL", "SKEPTIC", "KNIVES", "CLAWS", "TEETH", "SPEARS", "HUNT", "PACKS", "CRISIS", "HAPPENS", "YOUNG", "TAVERN", "ENTERTAINMENT", "CONTEST", "AREAS", "INTERESTING", "SHRINE", "ALTER", "GUIDE", "SKEPTICAL", "VOLATILE", "STRANGERS", "CHASTISE", "CLOSELY", "STRAY", "PATH", "TRIES", "ERIK", "SEED", "BEGINS", "OPENING", "TROUBLES", "CONVERSATION", "DESPERATE", "TABLE", "PULLS", "DIARY", "PAGES", "CAPTORS", "CONSIDERS", "DECLARE", "HOLOGRAM", "ALLIES", "FOLLOWING", "WISP", "WOOD", "SMASHED", "FOOTPRINTS", "SOMEHOW", "DISAPPEAR", "WHOEVER", "SCENE", "SEES", "DRIED", "VISIBLE", "RAINED", "SLIGHTLY", "WOODEN", "SPANS", "NPC", "DETECT", "TRIP", "WIRES", "TRIPS", "COLLAPSE", "SENDING", "SORTS", "PUZZLES", "DESCENDENT", "CONFUSING", "BILL", "HATCH", "MUTATED", "HENCE", "FATHER", "FAMILY", "WOODS", "KIDNAPPED", "JACKAL", "ILLNESS", "PARENTS", "BITTEN", "BEETLE", "SURVIVED", "DOWNHILL", "LINE", "JUNKTOWN", "GRIEF", "CURRENTLY", "GRANDFATHER", "WARD", "DAMN", "LIBERALS", "TERM", "LIBERAL", "DEFEND", "UNKNOWN", "AMMO", "SUPERSTITIOUS", "FEROCIOUS", "BEAST", "SIGN", "PASSING", "DISHEVELED", "FIGHTERS", "SCENT", "MYSTICAL", "QUALITY", "CURFEW", "MOTHER", "LATEST", "CUB", "DISAPPEARANCE", "BRANCHES", "INDICATED", "STRUGGLE", "WHATEVER", "MASTERFULLY", "STEALTH", "CLOTHING", "OVERLOOKED", "DEFINITE", "MARKINGS", "RECOGNIZE", "THEIRS", "SHOWN", "SHRUG", "SUGGESTION", "ANSWERS", "BLOOD", "SHED", "HIRED", "CHECK", "LEGENDS", "CRATER", "SOUTH", "THIEVES", "SNUCK", "SOLD", "FORTH", "OWED", "CALLS", "BARNSTORM", "COOL", "REALLY", "TAKING", "CARE", "CONFRONT", "OWNER", "WHOLE", "DESCENDANTS", "CIRCUS", "OWNERS", "TAUGHT", "SETTLE", "COMING", "NIGHTCLUB", "MAGICIANS", "DOING", "BOUGHT", "SUCKER", "CONSISTED", "DANCERS", "ACROBATS", "KHANS", "LOVED", "DANCING", "PERFORMERS", "WONDERS", "RADIOACTIVE", "PIT", "WALKED", "HUNTED", "SHRUGGED", "CARED", "STUPID", "FAMILIES", "FEED", "REASONS", "UNDETECTED", "BIGGER", "CARES", "OBSESSED", "FAMOUS", "YEAR", "PINPOINTED", "APPROXIMATE", "EQUIPPED", "CAPTURE", "LEGENDARY", "POSSESSION", "SHOTGUN", "BLOW", "CIRCUMSTANCE", "BORED", "FURRY", "RODENTS", "RARE", "SCORPION", "DISAPPOINTMENT", "VENOM", "BARRENS", "LOYAL", "GAINS", "LEAST", "DEEMS", "APPROPRIATE", "PLACES", "CUSTOMER", "ENEMY", "CATHEDRAL", "ENCLAVE", "AMONGST", "LA", "LOOMS", "SHADOW", "SPRAWL", "GRASPING", "SPIRES", "CLAWING", "REMAINED", "STANDING", "FLATTENED", "ATOMIC", "BLAST", "MYSTERY", "SHROUDED", "SUBTERRANEAN", "SCHEDULE", "EVENT", "INHABITANTS", "THANKFUL", "DECADES", "DEVOUT", "MORPHEUS", "BLACKSTAFF", "INFILTRATE", "SOCIETY", "SPIED", "MUTATNTS", "CAUGHT", "HAULED", "VATS", "METAMORPHOSIS", "USUAL", "CONSTRUCTION", "VAULTS", "INVADED", "EXTENSIVE", "LABORATORIES", "DECIDED", "LAY", "MOVED", "DEITY", "DUBBED", "DREGS", "BONEYARD", "FLOURISHES", "SILVER", "STREAKS", "GREY", "EYES", "GAUNT", "COMPLEXION", "WORSHIPERS", "WORSHIP", "NIGHT", "CONSISTING", "PUNKS", "GANGERS", "TRULY", "STANDS", "FAITH", "WHOLEHEARTEDLY", "MEET", "EVERYDAY", "WORRY", "YOUR", "RITUALS", "MAJORITY", "BELONG", "INTERFERES", "SACRIFICES", "EXECUTIONS", "OBVIOUSLY", "US", "SUICIDALY", "ERUPT", "FORM", "UNITE", "EMBRACE", "APPEARS", "CONVINCED", "CHOSEN", "CHARISMA", "BRAINWASHED", "CONSTANT", "INCESSANT", "RAMBLINGS", "SERVITORS", "GHOSTLY", "SERVITOR", "GRUELING", "INVOLVING", "TORTURE", "CHEMICAL", "BRAINWASHING", "MOUTH", "HANDS", "FOLD", "INFATICALLY", "GRASP", "NIGHTKIN", "WORTHY", "MISSIONS", "VASSALS", "INFILTRATION", "SABOTAGE", "PREPARE", "OPPOSE", "DISSIPATES", "GOALS", "HESITATION", "EMOTION", "REMORSE", "SPREAD", "MASK", "CONCERN", "CARING", "CRUSHED", "ARTS", "VOICES", "PRIESTS", "EXECUTIONERS", "UNDERGOING", "SEIZED", "CHAMBER", "CRAZED", "LOBOTOMIZED", "IMPLANTED", "RELEASERS", "CHEMICALS", "OVERWHELMING", "AMOUNTS", "INHIBITORS", "ENDORPHINS", "ADRENALINE", "IMPLANTS", "NEURAL", "RECEPTORS", "ROUTING", "SIGNALS", "ENDORPHIN", "PRODUCTION", "EFFECTIVELY", "SUBJECT", "HURT", "INCREDIBLE", "BOOST", "SPEED", "STAMINA", "PLEASURE", "NUMBED", "PUPPETS", "TRAINED", "INDEPENDENT", "PROPERLY", "MODIFIED", "DRONES", "REQUIRING", "BRUTALITY", "CONDUCTING", "STARVATION", "EAT", "SLEEP", "FEARED", "CONTINGENT", "INHUMAN", "BELOW", "SCHEMING", "CONQUERS", "FAVORABLE", "COMMANDED", "CONDUCT", "STEP", "HEEDED", "RECEIVING", "MESSAGES", "SACRIFICE", "APPEARED", "MEANING", "EMBODIMENT", "HOPED", "SNAKELIKE", "FANATIC", "SEVEN", "TOWNS", "FALLEN", "SELF", "PROCLAIMED", "RESIDENCE", "INTRUSION", "PROTECTS", "INNERMOST", "SECRETS", "PARANOIA", "PSYCHE", "PLOTTED", "PRECIOUS", "HERETICS", "GLORY", "PLACED", "OVERSEE", "ACCOMPLISHED", "MISTAKES", "TRUSTED", "ACCURATELY", "DETAIL", "MOVING", "VIEWS", "TOOL", "EQUIVALENT", "ASSASSIN", "WIPE", "SIEGE", "WATCHFUL", "EYE", "MONSTROUS", "HIDE", "VISAGE", "SIZE", "UNFAITHFUL", "RANKS", "ASSASSINATIONS", "CONSIDERED", "STREETS", "CONCEALED", "SHOTGUNS", "BRUTE", "LACK", "PROWESS", "HANDGUN", "EXCEL", "BEATING", "CRAP", "BIG", "TECH", "EASILY", "RESIDING", "ERUPTS", "DOZENS", "GOSSIPING", "GAMES", "HANGING", "WARY", "WARM", "CROWDS", "SPREADING", "INFORMED", "AMPHITHEATER", "CLOSED", "BUNK", "MEDITATION", "SPACED", "GATHER", "PRAY", "VISION", "AUTHENTICITY", "STAY", "DRINK", "FILTHY", "ELECTRICITY", "GENERATOR", "BREAKERS", "FAMILIAR", "CABLES", "SIPHONS", "CONDUCTS", "PRIVATE", "BENCHES", "DAIS", "STAIRS", "RAISED", "CANDELABRAS", "CROWDED", "THEATER", "DESCENDING", "RELAY", "SECRETIVE", "STEALTHY", "SHADOWS", "STORM", "RUSH", "ALLEY", "COMMIT", "MURDEROUS", "DEEDS", "CONVERSION", "WORSHIPER", "GRANTED", "MISCELLANEOUS", "STARK", "RAVING", "LUNATICS", "CRAZY", "BEDROOMS", "MATERIAL", "EMPTY", "ACTIVITIES", "AUDIENCE", "DISCUSS", "LURKING", "TWISTED", "STAINED", "SURROUNDED", "READILY", "APPARENT", "STACKED", "CAPABLE", "SURROUNDINGS", "REFUSE", "IDENTICAL", "STATIONED", "MEETINGS", "PLUSH", "STRATEGIES", "KINDS", "RICHES", "FARTHEST", "CONFINED", "CONQUEST", "DEATHLY", "AFRAID", "SPYING", "FAVORITE", "GURPS", "CAVERN", "EXPANDED", "THOUSAND", "BUSINESSES", "GOVERNMENT", "OFFICES", "GRANITE", "ENGINEERS", "ARCHITECTS", "PLANNED", "INEXHAUSTIBLE", "GEOTHERMAL", "EXCHANGERS", "CISTERN", "PLANT", "INDEFINITELY", "ATMOSPHERIC", "SCRUBBED", "INTERNAL", "REFRESHED", "CAVERNS", "STOREROOMS", "CRATES", "PACKETS", "CONSUME", "PONDEROUS", "AIRLOCK", "FRAME", "HUNDRED", "EMERGENCY", "BROADCASTS", "POLICE", "LOUDSPEAKERS", "SIRENS", "COUNTRY", "EVERYTIME", "SPENT", "COLD", "DANK", "ANNOUNCEMENT", "NATION", "DECLARED", "SCANDALOUS", "ALERT", "SAT", "RHYTHMIC", "POUNDING", "RADIOS", "TELEVISIONS", "PRODUCED", "STATIC", "MONITORS", "GRADUALLY", "MEAGER", "BELONGINGS", "HOUSING", "ATE", "DRANK", "BREATHED", "SLOWLY", "ADJUSTED", "DROPPED", "SAFER", "VOLUNTEERS", "OBJECTIVE", "SCOUT", "VOLUNTEER", "SITUATIONS", "NONE", "MICROCHIP", "FOUL", "MONTHS", "FUTURE", "STAKE", "VENTURE", "DOOM", "HERO", "REMOTE", "POSSIBILITY", "ENDURE", "AHEAD", "STRAWS", "DRAWN", "ADVANTAGES", "EXPLANATION", "ADEQUATE", "N", "OVERALL", "GOAL", "REPLENISHING", "DISADVANTAGES", "LIMIT", "NOMADS", "BRIGANDS", "WARRING", "TRIBES", "OUTLAWS", "NEARBY", "VILLAGES", "CLAN", "TYPICAL", "CRAZIES", "MORALS", "TACTICS", "OVERMATCH", "CRAVEN", "COWARDS", "WIN", "HIDEAWAY", "SPOILS", "VIPERS", "CLAIM", "RUTHLESS", "PREFER", "CARVED", "BONE", "DIPPED", "VIPER", "POISON", "STREAM", "PARALYSES", "VICTIM", "VICTIMS", "HIDEOUT", "LIFESTYLES", "MONGOL", "BURNING", "CAPTURING", "SCOUTING", "ROAM", "ENGAGING", "FISTS", "CLUBS", "SUPERIOR", "PREVIOUS", "PARTICULARLY", "OVERPOPULATED", "EMERGED", "WHOSE", "LEADERS", "IDEAS", "DHARMA", "SHADY", "SANDS", "PRIMITIVE", "WARLIKE", "DRIVEN", "DOMAIN", "BACKGROUNDS", "LISTED", "BANSHEE", "IMPOSSIBLE", "MOOD", "PSYCHO", "SULLEN", "SOLITARY", "LEATHERS", "FLAK", "JACKET", "GRUNGY", "SCARF", "TINY", "ROUND", "SUNGLASSES", "SWINGS", "PLEASE", "ASP", "CEREMONIES", "ADMINISTRATES", "DUTIES", "MEANT", "WEARS", "SNAKE", "ADORNED", "FEATHERS", "SKIN", "CAPE", "GARL", "AMBITIONS", "RIGHTFUL", "KHAN", "STRONGEST", "TIRE", "FLOWING", "SPEAR", "ACCURACY", "PETS", "RIP", "TEAR", "THRONE", "CONQUER", "HAREM", "DRESS", "JUNK", "LEATHER", "DUSTERS", "FAVORED", "PISTOL", "IMPLIES", "STRIPS", "BUNDLED", "TATTOOS", "EXOTIC", "PIERCINGS", "PISTOLS", "FURS", "HEAVY", "BOOTS", "ARM", "BRACERS", "WARPATH", "DON", "TIRES", "RAGS", "DRESSES", "RAMSHACKLE", "X", "HOLE", "TRAPDOOR", "CEILING", "LADDER", "BEDROOM", "SLITHER", "MEAL", "CLAIMING", "CORPORATE", "SEA", "SWEPT", "DRAINED", "TOPPLED", "WORN", "BRUTAL", "FELLOW", "COBRA", "BREWER", "SAMANTHA", "ROBERTS", "PRISONER", "KIDNAPS", "COYOTE", "CORN", "BOBBLEHEAD", "BORDER", "CLANS", "CONTENDING", "SCARCE", "RESOURCES", "NECROPOLIS", "UNLUCKY", "ENCOUNTERING", "RANDOM", "CASES", "HIDEOUTS", "ESSENTIALLY", "RAIDER", "ASHAMED", "SURVIVALISTS", "LOOTING", "BARBARIC", "LOOT", "PILLAGE", "TWENTY", "WEAKER", "INFERIOR", "PRESSED", "SICK", "OUTCASTS", "STATION", "ELDERLY", "TESTED", "AGE", "INSTANTLY", "THROWN", "MALES", "MALE", "HISTORICAL", "CONQUORER", "BRICK", "THEREFORE", "RULED", "TEN", "GURU", "STOLE", "DETHRONED", "WARS", "RULERS", "CONSECUTIVELY", "GENERAL", "EGO", "ENTIRE", "GENGHIS", "CHANGED", "EMPIRE", "CAPITOL", "LEGIONS", "PALACE", "SUN", "SKYSCRAPER", "FLOORS", "APART", "PAPER", "PLUS", "DUNGEON", "PRISONERS", "GLADIATORS", "ARENA", "INTACT", "AGES", "CORRODED", "COLISEUM", "ITALY", "HALLWAYS", "CRUMBLING", "OPPORTUNITY", "SERIES", "BATTLES", "CHOICE", "HITS", "HOST", "AQUARIUS", "INSISTS", "INTRUDER", "OFFENSE", "INSULT", "JUMP", "APPROACHED", "STASH", "SEWAGE", "AGREES", "SEWER", "MAZE", "MAZES", "WILDLY", "EXCLAIM", "SHOTS", "CACKLING", "GLADIATOR", "ROUNDS", "REVENGE", "CAGE", "BEDRAGGLED", "ESCAPES", "PREPARING", "CUT", "REVOLT", "APPRECIATION", "RECOVER", "GHENGIS", "TAUNTED", "REWARDED", "ASSASSINATE", "DAGGER", "THROWS", "TREASURE", "ASSOCIATES", "TREACHEROUS", "BASTARD", "SOLDIER", "EXPOSE", "WARNS", "CIVIL", "CHARGE", "CEREMONIAL", "LIKES", "RIVAL", "UPROAR", "TRANCE", "STEALS", "REPUTATION", "MANAGES", "RELEASE", "BEDCHAMBER", "SUGGEST", "BARELY", "BUNKER", "LOSE", "BUY", "NATHAN", "TAURUS", "NEITHER", "GEEKS", "SETTLED", "DECIMATING", "CHEAT", "AGREED", "BURNED", "EXPEDITION", "FOLLOWED", "LOVER", "HERSELF", "SHOWED", "HARDER", "HATRED", "MERCILESS", "TIMERS", "FEROCITY", "STUNNED", "LIMPED", "MARKED", "LEGION", "WORKED", "SAMANTHA", "PRESUMED", "CALLING", "LAWLESS", "COWARDLY", "REDUCED", "TODAY", "VEHEMENTLY", "TRANSGRESSION", "RESIDES", "OUTNUMBERS", "SUCCEEDS", "DEFEATING", "COW", "NOTORIOUS", "APOLOGIZE", "BEHAVIOR", "DARING", "RELIC", "SUPPOSED", "SELL", "FEAT", "OUTRAGED", "LONE", "ORDERED", "DENIES", "BULLY", "AGREEING", "BTW", "SHOT", "GREED", "PROFIT", "MARKET", "HURTING", "LIKEWISE", "FANATICS", "BACKSTABS", "SMILE", "ROB", "WALLET", "BUMP", "PICKPOCKETING", "ROLE", "TELEPHONE", "RID", "BIGGEST", "RUMOR", "INCLUDING", "CONSPIRING", "TURNS", "ANGRY", "MISTRUSTING", "JONATHAN", "FAUST", "OVERCROWDED", "RESTING", "DARKNESS", "SLIPPED", "SLID", "LEG", "DAZED", "DOZEN", "GIGANTIC", "SLITHERED", "TERRIFIED", "LOUD", "SCREAM", "LEADERLESS", "STUCK", "TARP", "NAILED", "SPIKES", "HORROR", "ENCASED", "INFLUENTIAL", "ARGUED", "JOINING", "WEEK", "SPECTRAL", "WANE", "PALE", "EMANCIPATED", "FEVERISH", "GLEAM", "VISITED", "WEALTH", "HAPPINESS", "VIOLENTLY", "REBELLIOUS", "PATIENTLY", "LISTENED", "WHISTLED", "WARNING", "STRUCK", "LAUGHED", "FLESH", "AROSE", "SNAKES", "BRINK", "SINK", "AFTERNOON", "AFTEREFFECTS", "IMMUNE", "WHISPERED", "SPARED", "MIGHTY", "BLASPHEMERS", "WINDING", "SNAKEKEEPER", "PRIEST", "MANHOOD", "MIXTURE", "OFFICIALLY", "MONTHLY", "RITUAL", "PRIESTESSES", "QUANTITIES", "CAUSES", "DREAMS", "SUMMONING", "LISTS", "LAYS", "FED", "SANCTUARY", "ATTENDS", "GOVERNMENTAL", "MATE", "HIGHPRIESTESS", "LINED", "TORCHES", "SITS", "SKULLS", "BONES", "CAGES", "TAINT", "UNBELIEVERS", "PITS", "DUG", "ENTRANCES", "IRON", "GRATES", "STONE", "CRIMSON", "TONGUE", "ASCENSION", "LODGE", "PURPOSES", "RANSOM", "CONFRONTED", "WASTE", "SASH", "PEACEFULLY", "EXPLAIN", "CANDY", "BLESSED", "DAGGERS", "FAST", "DEVOTE", "BLAH", "BENEFIT", "ALLEGIANCE", "ESCORT", "TWIST", "GRAB", "POISONOUS", "PROVISIONS", "HORRIBLE", "CHAOS", "OFFICERS", "PICTURE", "REFUSES", "AFFRONT", "WASHES", "POOL", "SAFELY", "VISITS", "CONVINCES", "HONORABLE", "SCRIPTING", "BOY", "LOCK", "CAREFUL", "WATCHED", "BREAKS", "B", "C", "ERASED", "SACRIFICED", "COMPANIONS", "LETTING", "MACHO", "ERIC", "BUST", "GUARDING", "LIKELY", "ELABORATE", "MIDNIGHT", "TUNNELS", "ROCKS", "RATS", "NASTY", "CLIMB", "GUESS", "DECLINE", "OFFERED", "RATIONS", "ASIDE", "SAD", "TALE", "OUTSIDER", "WARRIOR", "DELIRIUM", "FOREVER", "CAST", "COMA", "FALLING", "FANG", "UNDERGONE", "HUSBAND", "FAIL", "POTION", "WAKE", "SLUMBER", "CURE", "TONIGHT", "RESCUE", "WRITER", "GABBING", "STRIKING", "KID", "SEPTEMBER", "THRIVING", "LARGEST", "POP", "WHEEL", "SPOKES", "WARES", "MILES", "SWAP", "RESTAURANT", "RESIDENTS", "FARMS", "CORRALS", "SURROUNDS", "STRAIGHT", "RULING", "COMMITTEE", "SHOPLIFTING", "SERVANT", "THIEF", "PAYS", "MONETARY", "VALUE", "COMMITS", "MURDER", "CRIME", "CONSPIRACY", "PENALTY", "ENFORCED", "ENFORCE", "NOTED", "SPECIALIZE", "TRADERS", "PILED", "CLOCKWORK", "SLAMMED", "CAPACITY", "CALCULATED", "ASCENDED", "RELIEVED", "WASTED", "DENYING", "INEVITABLE", "RAN", "SPRING", "EXODUS", "REFUGEES", "OBLIVION", "MAGIC", "FERTILE", "TREES", "OILY", "CREATED", "WASTING", "MUTATE", "HORRIBLY", "ANGUS", "SETTLEMENTS", "BLASTED", "GOVERNOR", "BRUTALLY", "ASSASSINATED", "SHERIFF", "ORGANIZATION", "DEMANDED", "PAY", "TOLL", "RAGED", "BOOTED", "OUSTED", "BLOODSHED", "NUMBERED", "OFFICER", "ROY", "GREENED", "ARBITRATOR", "HAZY", "AGREEMENT", "CONCERNED", "OVERPRICE", "OFFICIALS", "EXPRESS", "CONCERNS", "VOTE", "THEORETICALLY", "RUDY", "FENCE", "ARRESTED", "WILDFIRE", "TRUSTING", "WELCOMED", "PAYING", "PERCENTAGE", "ACTUAL", "DEVELOPED", "SPONSORED", "UNEASY", "THIRTY", "LOTS", "JUSTIN", "GODFATHER", "ESCORTS", "ARSENALS", "BOOTHS", "NORTHWEST", "COMPANIES", "FOND", "POLE", "LOCAL", "HANGOUT", "ALCOHOL", "MOONSHINE", "SNACKS", "MALTASE", "FALCON", "OWNED", "TRINITY", "HOSPITAL", "ACCESSIBILITY", "REASONABLY", "PRICED", "HONEST", "NEON", "CONNECTIONS", "MINOR", "WRONG", "WESTERN", "WALKS", "TWANG", "MUSIC", "JUKE", "BOX", "IGUANA", "INDISTINGUISHABLE", "LOVELY", "CONCOCTION", "INGREDIENTS", "TASTES", "BOB", "PUTS", "DOC", "MORBID", "CASINO", "TILES", "OBJECTS", "BASIC", "POPULAR", "LOCALS", "SELLS", "GAS", "MASKS", "FRUIT", "ARMS", "SHOP", "HARDWARE", "HAMMERS", "NAILS", "KITS", "LENDING", "COMPANY", "AVERAGE", "NICE", "LOAN", "BORROW", "CASH", "GUIDO", "KNEECAPS", "FONDLY", "RUSTED", "FRIDAY", "SATURDAY", "NIGHTS", "CRIMINALS", "PAID", "CONVICTED", "MURDERER", "FIGHTER", "SURRENDERS", "SCATTERED", "LOSES", "BELIES", "CONTENTS", "RIFLES", "JACOB", "DEALER", "NONDESCRIPT", "PLENTY", "INFAMOUS", "ADVERTISE", "SNIFF", "COUPLE", "GROWING", "PREACH", "WACKOS", "PRISONS", "KEY", "WAREHOUSE", "ROBBERS", "MUSCLING", "DEFINITELY", "RUNDOWN", "DIRTY", "VIRTUAL", "SURVEILLANCE", "RESIDENT", "BELONGING", "MANSIONS", "DECREPIT", "POOR", "PITIFUL", "SERVANTS", "SHACKS", "HEIGHTS", "WEALTHY", "BASES", "SOUTHEAST", "DAREN", "HIGHTOWER", "DELIMITER", "ROMARA", "BUTCH", "HARRIS", "THOMAS", "BARLEY", "HUMOROUS", "CRACKING", "JOKES", "JOLLY", "LANCE", "RAZOR", "JOE", "DEAN", "ORLEANS", "INGROWN", "FRANK", "FORGOT", "SHRUGS", "SOUNDED", "BETTY", "CHEAP", "TRICKS", "MISC", "DECK", "OWNS", "DAPPER", "GENTLEMAN", "PRISTINE", "MASS", "JERRY", "SHINER", "AGILE", "MELISSA", "ETHAN", "TEXAS", "KISSED", "NAMES", "SCOTT", "CAPTAIN", "ACQUIRE", "SEEDY", "HERALD", "ADD", "BLAMED", "STABLE", "WISER", "ADVERTISES", "CATEGORIZED", "MISERS", "LOWEST", "VENGEANCE", "STRANGEST", "POST", "EASIEST", "SUCCESSFULLY", "WAGON", "ROAD", "LUCK", "MISTRUSTFUL", "DRIVER", "CARGO", "GRAVE", "HERBS", "FIXES", "RECOMMENDATION", "RATE", "CRY", "RUGRAT", "MY", "TENT", "STOPS", "SHOUTS", "MUGGED", "SAVES", "REPORT", "DEED", "BOOTH", "HIRE", "ELIGIBLE", "CRUCIAL", "DOLLARS", "RANSACKING", "MICHAEL", "WEEKS", "CLOUD", "ROSE", "MUTTER", "LYING", "PRYING", "WHISPER", "CLAW", "UM", "HEARS", "SKETCHY", "WILD", "GHOST", "HILLS", "DEMON", "CAVE", "WOMP", "PROCESSION", "YELL", "INTERROGATE", "WAGONS", "DESTROYS", "FORTIFY", "CHURCH", "KICK", "RANSACKS", "WHEREABOUTS", "BROADCAST", "LEUTENANT", "MOTION", "LOADS", "OUTRAGEOUS", "CORRESPONDING", "CONTENT", "TRADER", "DWINDLE", "BODYGUARDS", "GUIDES", "ROUTES", "NOISE", "CLUMP", "PATROL", "NOISES", "RUSTLING", "SCARED", "MOW", "CONFESS", "TANKS", "LETS", "SHUNNED", "UPSET", "SUDDENLY", "DISPLEASED", "DUCK", "TRASH", "PILE", "OFFICE", "INSERTED", "BODYGUARD", "INTRODUCES", "TEMPORARILY", "DISBAND", "DISBANDS", "NE", "GETTING", "TRADED", "RIPPED", "FEE", "EXPENSIVE", "BOOTY", "STANDARD", "FEBRUARY", "SEARCHING", "HIV", "STARTLING", "DISCOVERY", "BOMBARDMENT", "CUSTOM", "VIRAL", "AGENT", "INTRODUCED", "CONTAMINATION", "HARMFUL", "EFFECTS", "LAB", "HEALTHIER", "DUE", "MUTATIONAL", "QUALITIES", "NERVOUS", "STIMULATED", "GROWTH", "BRAIN", "TISSUE", "INCREASED", "MUSCLE", "LABORATORY", "PROGRESSIVELY", "CHIMPANZEES", "PROLONGED", "EXPOSURE", "EVOLUTIONARY", "PENDELTON", "INJECTED", "PATIENTS", "STAGES", "CANCERS", "ILLNESSES", "DEVOURED", "EXPERIENCED", "ABNORMAL", "INSANITY", "WIDESPREAD", "MUTATIONS", "LEPROSY", "ALTERING", "SKELETAL", "COOLLY", "RECORDED", "NOTES", "NEWS", "LEAKED", "COUNTRIES", "CREATING", "DOMINATION", "TENSIONS", "ARMAGEDDON", "LAUNCHED", "OCTOBER", "MISSILES", "AMERICANS", "RETALIATED", "THREATENING", "LAUNCH", "NUKES", "PANICKED", "MILLIONS", "INSTANT", "CALIFORNIA", "BORE", "BRUNT", "BLASTS", "TORE", "FAULT", "SEPARATING", "MAINLAND", "SMOKING", "BOWELS", "CONTAINERS", "RELEASING", "ATMOSPHERE", "WINDS", "GLOBE", "RAIN", "RADIOACTIVITY", "ODD", "SKIES", "PERMANENTLY", "DNA", "SPIRAL", "GUARDIANS", "SHIELDED", "PERSONNEL", "CONCLUSION", "FLOURISH", "DISCOVERED", "GRUNTS", "RAIDED", "IMPROVED", "REOPEN", "AVOID", "UNDERSTAND", "RECORD", "RAVAGES", "REPLICATE", "BELIEF", "SCANT", "REVERED", "ARTIFACTS", "GUARDIAN", "CITADEL", "SOUTHWARDS", "CONTAINING", "SEPARATION", "ROVING", "MAGNITUDE", "RANSACK", "LOSING", "FIREFIGHT", "INTERROGATION", "KEYS", "SPOKE", "SEALS", "DELVED", "CANISTERS", "DIVINE", "LABELED", "DRENCHED", "EXPOSED", "UNDERWENT", "EXTREME", "BEYOND", "CELLULAR", "TOXIC", "CRIED", "ANGUISH", "HEIGHTENED", "INCREASING", "DRENCH", "SOLUTION", "GRADUAL", "SCOPE", "DISCOVERIES", "RELATIONSHIP", "MOLECULE", "ENABLING", "METER", "BRAINWAVES", "PARTICLES", "SKINS", "COARSE", "COVERS", "SEEMED", "DEVOLVE", "PRIMATE", "SHARPER", "CRUEL", "SADISTIC", "DELIGHTING", "TORTURING", "INNOCENTS", "UNDERESTIMATED", "WORSHIPPING", "PRAYER", "BELIEFS", "HALLUCINATION", "THREW", "GODLIKE", "DIVINITY", "CITIES", "SERVICE", "FLOURISHED", "GAINING", "REACHES", "RANGER", "STOUT", "RANGERS", "FENDED", "CHASED", "TEMPLES", "ELIMINATING", "MODERN", "SENSED", "IMAGINED", "POSED", "THREAT", "SEAT", "TROUBLING", "ROAMING", "DISTURBING", "PSIONIC", "SOUL", "JUDGED", "ANNIHILATED", "PUTTING", "UNSPEAKABLE", "TESTS", "ABOMINATIONS", "TREATMENTS", "SPIES", "UNDERWAY", "DISTANCE", "POPULATIONS", "ARMADILLO", "JUNCTION", "EXCLUSIVELY", "MUTUAL", "WIPED", "COSTING", "CASUALTIES", "POSSIBLY", "SELECT", "MASTERS", "REFUNDED", "ATTRACTING", "TH", "HOPES", "LOCALES", "FRUITS", "VEGGIES", "FIELDS", "APPREHENSIVE", "PLAGUED", "RAD", "SCORPIONS", "GUMMING", "DISAPPEARING", "AUTOMOBILE", "SCRAP", "YARD", "CAVES", "FESTERS", "DEVASTATION", "SAVAGE", "SALTON", "SALT", "SWAMP", "CUTTHROATS", "SLOW", "DECAY", "ERECTED", "UNWANTED", "SHAMBLING", "GROTESQUE", "ROBOT", "COCHISE", "CYBORGS", "SALVAGED", "EVERYWHERE", "WORKS", "MUSHROOM", "UNIMPORTANT", "FACT", "ENTIRELY", "BURN", "BREAKFAST", "TIAJUANA", "BANDITOS", "CUCARACHAS", "INDIAN", "CITADELS", "HUTS", "BURROW", "MEAN", "BARTERTOWNE", "MARCH", "UNCOVERED", "TAKINGS", "ZEALOUS", "XENOPHOBES", "STRUCTURES", "SALVAGE", "IRVINE", "UTOPIA", "BASTION", "INSULOMA", "OUTPOST", "SEASIDE", "PERSECUTION", "GANGS", "RESURRECTION", "RECRUITING", "SEWERS", "CATACOMBS", "CROWBAR", "SHOVEL", "POCKET", "SPYGLASS", "LANTERN", "TORCH", "FLASHLIGHT", "HANDCUFFS", "HOLSTER", "BINOCULARS", "BATTERIES", "ORDINARY", "CLOTHES", "FORMAL", "BACKPACK", "CANTEEN", "YD", "ROPE", "CLIMBING", "SLEEPING", "BAG", "CAMPING", "FISHING", "FLASH", "FLARE", "SPRAY", "PAINT", "CANISTER", "NERVE", "SMOKE", "GRENADE", "DYNAMITE", "PLASTIC", "EXPLOSIVE", "BRASS", "KNUCKLES", "CATTLE", "PROD", "ITCHING", "POWDER", "MACE", "SLAP", "GLOVE", "SLR", "SPIKE", "ROD", "GRAPPLING", "HOOK", "ANKLE", "TROUSER", "WEB", "BELT", "BANDOLEER", "CLEANING", "KIT", "POUCH", "SILENCER", "SUPPRESSER", "INFRARED", "NIGHTVISION", "GOGGLES", "RANGEFINDER", "FIELD", "RADIO", "HEADSET", "WALKIETALKIE", "DETECTOR", "SIGNALER", "LOCKPICK", "COMPASS", "DISPOSABLE", "LIGHTER", "INSECT", "REPELLENT", "UTENSIL", "BEAR", "TRAP", "SNARE", "BRIEFCASE", "CAMOUFLAGE", "WIRE", "CUTTERS", "RATION", "MOLOTOV", "COCKTAIL", "DRUG", "RIG", "GOLF", "CLUB", "HAMMER", "CHAINSAW", "SCREEN", "BOTTLE", "BLANKET", "PILLOW", "EXTINGUISHER", "CUTTING", "CHAIR", "STOOL", "GLASS", "BOTTLES", "BOOZE", "MEAT", "CLEAVER", "SWITCH", "BLADE", "POTS", "PANS", "RAT", "TROPHY", "PAINTING", "CURTAINS", "WAD", "MICROWAVE", "LAMP", "MIRROR", "ORDERING", "MENU", "TWINKIE", "COCKROACH", "SERVING", "TRAY", "CRASH", "SCALPEL", "LOCKPICKS", "SWISS", "SPOON", "FORK", "CUP", "TOWEL", "SOAP", "TOOTHBRUSH", "ELECTRIC", "WRIST", "TWOBYFOUR", "NAIL", "HATCHET", "AXE", "THROWING", "SLEDGE", "BLACKJACK", "MACHETE", "STILETTO", "HALBERD", "BATON", "KATANA", "QUARTERSTAFF", "MAUL", "SCYTHE", "STUN", "RIPPER", "CROSSBOW", "SLING", "OIL", "FLASK", "FLOCK", "MM", "IMI", "EAGLE", "M", "COLT", "PYTHON", "REM", "G", "AK", "PSG", "W", "UZI", "MP", "LAUNCHER", "ROCKET", "MINIGUN", "THROWER", "FRAG", "INCENDIARY", "BUNDLE", "CLIPS", "SHELLS", "GARBAGE", "CERAMIC", "PERFECT", "BARBED", "ELECTRIFIED", "PATROLLED", "SQUAD", "FREIGHT", "GOLD", "REACTOR", "SYNOPSES", "DETAILED", "TIMELINE", "OVERLOOKING", "TANK", "INFECTED", "LIQUID", "CRANE", "LITERALLY", "FLUID", "PULLED", "CONTAINED", "OBSERVATION", "SLIM", "LIEUTENANT", "SAMBA", "FIZZLES", "EGOS", "VAT", "GUY", "RATES", "NOWADAYS", "REFER", "PATHS", "MAINLY", "DEMEAN", "SHRUBS", "BLOWING", "TIM", "FLAG", "DUNGEONS", "TEMPORARY", "HEALTHY", "IMMERSED", "PEE", "CORRIDOR", "ENRAGE", "ENSUING", "OCCUPATION", "DUCT", "CORK", "BLOODLUST", "BLUDGEON", "EXAMINATION", "ACTIVATING", "AVAILABLE", "ENCOUNTERS", "CONTAINMENT", "HYDES", "TEMPERATURE", "INACCESSIBLE", "FILE", "DESTRUCT", "MASSACRE", "WROTE", "HACKER", "FUN", "SIT", "TYPED", "DOME", "MELTED", "STRETCHING", "RESIDENTIAL", "CIRCUMFERENCE", "APARTMENT", "SIZES", "KITCHEN", "DESK", "V", "CLOSET", "BATHROOM", "TOILET", "SONIC", "SHOWER", "BATHROOMS", "FUTURISTIC", "METALLIC", "FURNITURE", "CARPETED", "SUBTLE", "BLEND", "TILE", "APARTMENTS", "SHELVES", "MIRRORS", "CABINET", "THICKER", "INTERIORS", "ARROWS", "YELLOW", "STRIPES", "PF", "TE", "GYMNASIUM", "CEMETERY", "PANTHEIST", "LAUNDRY", "SCHOOL", "AGRICULTURE", "VEGETABLES", "MONITORED", "PIPES", "PATCHES", "GREENERY", "SOIL", "ATRIUM", "FLOWERS", "CONNECTS", "CATWALKS", "RESTRICTED", "MAINTENANCE", "LABS", "VIA", "OVERSEER", "STERILE", "SMOOTH", "SCREENS", "PANELS", "LIT", "BLINKING", "FINISHED", "STOREHOUSES", "INTENDED", "APOCALYPSE", "DARED", "COMMUNICATIONS", "DECORUM", "CONCERNING", "WELFARE", "LISA", "MANAGE", "MONOCOLOR", "JUMPSUIT", "OUTFIT", "COATS", "ESTABLISH", "TROOP", "PACIFISTS", "SADLY", "CONDUCTED", "MICRO", "PUBLIC", "PLAYS", "SOURCE", "EXERCISE", "DWELLER", "KARATE", "CLASS", "GROCERY", "ISSUED", "SLIPS", "FOODS", "MEATS", "SYNTHESIZED", "SOY", "FLAVORING", "INJURIES", "OCCUR", "GENUINE", "DISKS", "BORROWED", "CREMATED", "DRAWER", "PLAQUE", "SHRINES", "RELIGIONS", "SONICS", "STOREROOM", "GRADE", "UNTOUCHED", "MUSEUM", "DISPLAYED", "PAINTINGS", "SCULPTURES", "SUNDRIES", "ATTEND", "SPEAKERS", "CURRICULUM", "VIRTURAL", "STUDENTS", "MECHANICAL", "BROADCASTING", "REGULATES", "CLIMATE", "ACTS", "TEACHER", "PERSONA", "ANGELIC", "COMMUNICATING", "FAULTY", "FUSE", "RESULT", "OVERLOADING", "CHIP", "HEATED", "MELTING", "PURIFIER", "DISTINGUISH", "ESSENCE", "PURIFYING", "CONTAMINATED", "UNDRINKABLE", "PERIL", "THEREAFTER", "BEEPING", "REMINDING", "HOUR", "INTERFACE", "MILLING", "INTERCOM", "ANNOUNCE", "LOWDOWN", "PERISH", "CLOSEST", "MASSIVE", "RUMBLES", "STEPS", "CLOSES", "HISSING", "WRENCHING", "POUR", "POURING", "HOT", "TUNNEL", "VANQUISHED", "STOCK", "OCCUPANTS", "RECOVERED", "SPIN", "BALL", "INSTORE", "DETERMINED", "REENTER", "BEFELL", "AMBITION", "ANYTIME", "WONDERFUL", "HINTS", "S", "INTERCEPT", "PRIORITY", "NEGOTIATE", "WARNED", "OPTS", "DEFEATED", "FUNCTIONAL", "REMUSTER", "AWAYS", "COVER", "GARRISON", "OCCUPYING", "UNORGANIZED", "COMMISSION", "TRIUMPHED", "CREDITS"];