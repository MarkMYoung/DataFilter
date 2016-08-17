(function( QUnit, undefined )
{
$(document).ready( function()
{
	function logify()
	{
		var line = Array.prototype.slice.apply( arguments )
			.map( function( argument, a )
			{return((typeof( argument ) === 'object')?(JSON.stringify( argument )):(argument));})
			.join( ' ' );
		return( line );
	}
	//window.console.log = function()
	//{
	//	var $console = $('#console');
	//	$console.html( $console.html().concat( logify.apply( this, Array.prototype.slice.apply( arguments )), '<br/>' ));
	//};
	QUnit.module( "DataFilter" );
	QUnit.test( "Implicit AND", function( qUnit )
	{
		QUnit.expect( 2 );
		var original = [{'a':{'b':'3', 'c':"hi"}}, null, {'a':{'c':"bye"}}, {'a':null}];
		var whereClause = {"a":{"b":"3", "c":"hi"}};
		var filtered = original.filter( DataFilter.resultsWhere, whereClause );
		qUnit.strictEqual( filtered.length, 1, "Result length checked." );
		if( filtered.length >= 1 )
		{
			qUnit.deepEqual( filtered[ 0 ], original[ 0 ], "Objects in the where-clause object should be implicit ANDs." );
		}
		else
		{qUnit.ok( filtered.length >= 1, "Filtered results missing so results not compared." );}
	});
	QUnit.test( "Explicit AND", function( qUnit )
	{
		QUnit.expect( 2 );
		var original = [{'a':{'b':'3', 'c':"hi"}}, null, {'a':{'c':"bye"}}, {'a':null}];
		var whereClause = {"a":{"and":[{"op":">", "b":2}, {"op":"<", "b":4}]}};
		var filtered = original.filter( DataFilter.resultsWhere, whereClause );
		qUnit.strictEqual( filtered.length, 1, "Result length checked." );
		if( filtered.length >= 1 )
		{
			qUnit.deepEqual( filtered[ 0 ], original[ 0 ], "'and's in the where-clause object should be explicit ANDs." );
		}
		else
		{qUnit.ok( filtered.length >= 1, "Filtered results missing so results not compared." );}
	});
	QUnit.test( "Implicit OR", function( qUnit )
	{
		QUnit.expect( 2 );
		var original = [{'a':{'b':'3', 'c':"hi"}}, null, {'a':{'c':"bye"}}, {'a':null}];
		var whereClause = {"a":[{"b":"3"}, {"c":"hi"}]};
		var filtered = original.filter( DataFilter.resultsWhere, whereClause );
		qUnit.strictEqual( filtered.length, 1, "Result length checked." );
		if( filtered.length >= 1 )
		{
			qUnit.deepEqual( filtered[ 0 ], original[ 0 ], "Arrays in the where-clause object should be implicit ORs." );
		}
		else
		{qUnit.ok( filtered.length >= 1, "Filtered results missing so results not compared." );}
	});
	QUnit.test( "Explicit OR", function( qUnit )
	{
		QUnit.expect( 2 );
		var original = [{'a':{'b':'3', 'c':"hi"}}, null, {'a':{'c':"bye"}}, {'a':null}];
		var whereClause = {"a":{"or":{"b":"3", "c":"hi"}}};
		var filtered = original.filter( DataFilter.resultsWhere, whereClause );
		qUnit.strictEqual( filtered.length, 1, "Result length checked." );
		if( filtered.length >= 1 )
		{
			qUnit.deepEqual( filtered[ 0 ], original[ 0 ], "'or's in the where-clause object should be explicit ORs." );
		}
		else
		{qUnit.ok( filtered.length >= 1, "Filtered results missing so results not compared." );}
	});
	QUnit.test( "count and length comparison", function( qUnit )
	{
		QUnit.expect( 2 );
		var original = [{'a':{'b':'3', 'c':"hi"}}, null, {'a':{'c':"bye"}}, {'a':null}];
		var whereClause = {"op":">=", "count":4, "a":{"c":{"op":"<=", "length":2}}};
		var filtered = original.filter( DataFilter.resultsWhere, whereClause );
		qUnit.strictEqual( filtered.length, 1, "Result length checked." );
		if( filtered.length >= 1 )
		{
			qUnit.deepEqual( filtered[ 0 ], original[ 0 ], "'length's in the where-clause object check array lengths." );
		}
		else
		{qUnit.ok( filtered.length >= 1, "Filtered results missing so results not compared." );}
	});
	QUnit.test( "Explicit comparison operator", function( qUnit )
	{
		QUnit.expect( 2 );
		var original = [{'a':{'b':'3', 'c':"hi"}}, null, {'a':{'c':"bye"}}, {'a':null}];
		var whereClause = {"a":{"op":"=~", "b":"/\\d+/", "c":"/HI/i"}};
		var filtered = original.filter( DataFilter.resultsWhere, whereClause );
		qUnit.strictEqual( filtered.length, 1, "Result length checked." );
		if( filtered.length >= 1 )
		{
			qUnit.deepEqual( filtered[ 0 ], original[ 0 ], "'op's in the where-clause object should be explicit comparison operators." );
		}
		else
		{qUnit.ok( filtered.length >= 1, "Filtered results missing so results not compared." );}
	});
	QUnit.test( "Negation object", function( qUnit )
	{
		QUnit.expect( 2 );
		var original = [{'a':{'b':'3', 'c':"hi"}}, null, {'a':{'c':"bye"}}, {'a':null}];
		var whereClause = {"a":{"not":{"b":3}}};
		var filtered = original.filter( DataFilter.resultsWhere, whereClause );
		qUnit.strictEqual( filtered.length, 2, "Result length checked." );
		if( filtered.length >= 2 )
		{
			qUnit.deepEqual( filtered[ 0 ], original[ 0 ], "'not's in the where-clause object." );
		}
		else
		{qUnit.ok( false, "Filtered results missing so results not compared." );}
	});
	QUnit.test( "Negation array", function( qUnit )
	{
		QUnit.expect( 2 );
		var original = [{'a':{'b':'3', 'c':"hi"}}, null, {'a':{'c':"bye"}}, {'a':null}];
		var whereClause = {"a":{"not":[{"b":'2'}], "c":{"not":["bye"]}}};
		var filtered = original.filter( DataFilter.resultsWhere, whereClause );
		qUnit.strictEqual( filtered.length, 1, "Result length checked." );
		if( filtered.length >= 1 )
		{
			qUnit.deepEqual( filtered[ 0 ], original[ 0 ], "'not's in the where-clause object." );
		}
		else
		{qUnit.ok( false, "Filtered results missing so results not compared." );}
	});
	QUnit.test( "Complex sub-clause", function( qUnit )
	{
		QUnit.expect( 3 );
		// #1: 'original' starting data happens to be in an object, not an array.
		var original = 
		{
			'list':
			[
				{'a':{'b':'3', 'c':"hi"}}, 
				null, 
				{'a':{'c':"bye"}}, 
				{'a':null}
			],
			'sibling':"property"
		};
		var whereClause = 
		{
			// #2: The clause digs into the object's 'list' property.
			"list":
			{
				// #3: Wrap predicates in a 'subClause' so ancestor filtering is not affected.
				"subClause":
				{
					// #4: Not any of the following.
					"not":
					[
						// #4a: "falsey".
						[],
						// #4b: Containing a "falsey" 'a'.
						{"a":[]},
						// #4c: Containing an 'a' which contains a 'c' having value 'bye'.
						{"a":{"c":"bye"}}
					]
				}
			}
		};
		// #5: Wrap the object in an anonymous array so it can be processed in a list.
		var filtered = [original].filter( DataFilter.resultsWhere, whereClause );
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
		// #6: Since 'subClause' was used, 'filtered' will always be of length 
		//	one containing all, some portion, or none of 'original' as its 
		//	first item.  Without 'subClause' any failed predicate would have 
		//	resulted in 'filtered' being an empty array.
		qUnit.strictEqual( filtered.length, 1, "Result length checked." );
		if( filtered.length >= 1 )
		{
			qUnit.deepEqual( filtered[ 0 ].list[ 0 ], original.list[ 0 ], "Filtered results are correct." );
			qUnit.deepEqual( filtered[ 0 ].sibling, original.sibling, "Ancestral and sibling data not destroyed by 'subClause'." );
		}
		else
		{qUnit.ok( false, "Filtered results missing so results not compared." );}
	});
});
})( QUnit );