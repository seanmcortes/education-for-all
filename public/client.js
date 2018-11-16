// Program: Education For All
// Authors: Jason Anderson, Sean Cortes, Joel Huffman, Tingting Lin, Ting Ju Sheppy
// Concept: Jacob Carter

// Place helper functions such as button clicks and ajax calls here:

function getPerson(res, mysql, context, id, complete){
	    	    console.log("IN FUNCTION");
    	var sql = "SELECT student_id, first_ame, last_lame, DATE_FORMAT(DOB, '%Y-%m-%d') AS DOB, identification, user_id FROM student WHERE student_id = 1";
    	var inserts = [id];
    	mysql.pool.query(sql, inserts, function(error, results, fields){
	        if(error){
    	        res.write(JSON.stringify(error));
            	res.end();
        	}
    	    console.log(student_id);
    	    context.student = results[0];
    	    complete();
    	});
}
