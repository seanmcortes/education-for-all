// Program: Education For All
// Authors: Jason Anderson, Sean Cortes, Joel Huffman, Tingting Lin, Ting Ju Sheppy
// Concept: Jacob Carter


// Place helper functions such as button clicks and ajax calls here:
$(function() {
    var postAssignmentAnswerExample = function(answers_string) {
        $.post(window.location.pathname, 
        {
            answers: answers_string
        }, 
        function(result) {
            alert("Answers submitted successfully.");
        });
    };

    $("#submit-answer-btn").click(function() {
        var answer = $("#assignment-answer").val();
        postAssignmentAnswerExample(answer);
    });

});

