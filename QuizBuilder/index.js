var randomModule = require("../random");
var questionsModule =  require("../questions");
var isSeedValid = require('../validators/QuizValidator.js').isSeedValid;

function getQuestions(descriptor, randomStream) {
    var questions = [];
    var n = descriptor["questions"].length;

    for(var i = 0; i < n; ++i) {

        var item = descriptor.questions[i];

        if("question" in item) { //If this object is a question generator

            var questionType = item.question;
            var params = (("parameters" in item) ? item.parameters : null);
            var repeat = (("repeat" in item) ? item.repeat : 1);
            
            var question = ((questionType in questionsModule.questionTypes) ? questionsModule.questionTypes[questionType] : null);

            if (question == null) throw "Invalid Question Type: " + questionType + " is not a defined quesiton.";
            //Generate the specified number of the specified type of question, add them to the array
            
            for(var j=0; j<repeat; j++) {
                var newQuestion = new question.f(randomStream, params);
                questions.push(newQuestion); 
            }
        }

        /*  
        //Allows you to provide an array of question-generating objects (just like a quiz) to generate n questions
        //and choose k of those n at random.

        if("chooseK" in item) {
            var k = item.chooseK;
            var itemsArray = (("items" in item) ? item.items : []);
            var newArray = produceArrayOfQuestions(itemsArray, randomStream); //Recursively parse the array passed to chooseK
            //After this finishes newArray should consist solely of question objects
            
            randomStream.shuffle(newArray);
            questions = questions.concat(newArray.slice(0,k)); //Grab the first k elements and add them to the questions array
        } // chooseK
        
        //Allows you to shuffle a list of questions.
        //Essentially equivalent to a chooseK where K is the total number of questions generated,
        //but this is a little clearer and nicer than having to use that trick.

        if("shuffle" in item) {
            var itemsArray = (("items" in item) ? item.items : []);
            var newArray = produceArrayOfQuestions(itemsArray, randomStream);
            
            randomStream.shuffle(newArray);
            questions = questions.concat(newArray);     
        } // shuffle
        
        */

    }

    return questions; 
};

function build(descriptor, id, hexStringSeed) {
    if (!isSeedValid(hexStringSeed)) 
        throw new Error('Invalid Seed: ' + hexStringSeed + ' is not an 8 digit hexadecimal');
    
    var quiz = {};
    quiz.seed = hexStringSeed;
    var s = parseInt(hexStringSeed, 16);
    var randomStream = new randomModule.random(s);

    quiz.title = descriptor.title;
    quiz.id = id;
    quiz.questions = getQuestions(descriptor, randomStream);
	return quiz;
}

function validateQuizDescriptor(qd) {
    var errors = [];
    if (qd === undefined)
        return [{type:'UndefinedQuizDescriptor', path:[]}];
    if (typeof qd !== 'object')
        return [{type:'ExpectedObjectError', path:[]}];

    if (!('title' in qd))
        errors.unshift({ type: 'RequiredError', path:['title']});
    else if (typeof qd.title !== 'string')
        errors.unshift({ type: 'ExpectedStringError', path:['title']});

    if (!('version' in qd))
        errors.unshift({ type: 'RequiredError', path:['version']});
    else if (typeof qd.version !== 'string')
        errors.unshift({ type: 'ExpectedStringError', path:['version']});
    
    if (!('questions' in qd))
        errors.unshift({ type: 'RequiredError', path:['questions']});
    else if (!Array.isArray(qd.questions))
        errors.unshift({ type: 'ExpectedArrayError', path:['questions']});
    else {
        for (var i = 0; qd.questions.length > i; i++) {
            var qErrors = questionsModule.validateQuestionDescriptor(qd.questions[i]);
            qErrors = qErrors.map(function(qError) {
                qError.path = ['questions',i].concat(qError.path);
                return qError;
            });
            errors = errors.concat(qErrors);
        }
    }

    return errors;
}


module.exports.validateQuizDescriptor = validateQuizDescriptor;
module.exports.getQuestions = getQuestions;
module.exports.build = build;












