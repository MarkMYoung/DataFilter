// @author Mark M. Young <mark.young@agconnections.com>
// edited 2015-02-23 Changed nested 'resultsWhere' to 'subClause' to avoid 
//	confusion between function and reserved word.
// @version 1.6
// created 2014-09-02
// @version 1.5
var DataFilter = (function( window, undefined )
{
var DataFilter = {};
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
DataFilter.BooleanBinaryComparator =
{
	'==':function eq( each, other )
		{return( each == other );},
	'===':function xeq( each, other )
		{return( each === other );},
	// JavaScript gets a little weird when comparing 'null' and 'undefined' 
	//	against numbers and each other when using '<', '<=', '>', and '>='.
	'<':function lt( each, other )
		{return( each < other && (each !== null && each !== undefined && other !== null && other !== undefined));},
	'<=':function lte( each, other )
		{return( !(each > other) && ((each !== null && each !== undefined && other !== null && other !== undefined) || each == other));},
	'<==':function lte( each, other )
		{return( !(each > other) && ((each !== null && each !== undefined && other !== null && other !== undefined) || each === other));},
	'>':function gt( each, other )
		{return( each > other && (each !== null && each !== undefined && other !== null && other !== undefined));},
	'>=':function gte( each, other )
		{return( !(each < other) && ((each !== null && each !== undefined && other !== null && other !== undefined) || each == other));},
	'>==':function gte( each, other )
		{return( !(each < other) && ((each !== null && each !== undefined && other !== null && other !== undefined) || each === other));},

	//'-':function difference( each, other ){var ea = window.parseFloat( each );var ex = window.parseFloat( other );
	//	return( !window.isNaN( ea ) && !window.isNaN( ex ) && (ea - ex != 0));},
	//'%':function modulo( each, other ){var ea = window.parseFloat( each );var ex = window.parseFloat( other );
	//	return( !window.isNaN( ea ) && !window.isNaN( ex ) && (ea % ex != 0));},
	//'*':function product( each, other ){var ea = window.parseFloat( each );var ex = window.parseFloat( other );
	//	return( !window.isNaN( ea ) && !window.isNaN( ex ) && (ea * ex != 0));},
	//'/':function quotient( each, other ){var ea = window.parseFloat( each );var ex = window.parseFloat( other );
	//	return( !window.isNaN( ea ) && !window.isNaN( ex ) && (ea / ex != 0));},
	//'+':function sum( each, other ){var ea = window.parseFloat( each );var ex = window.parseFloat( other );
	//	return( !window.isNaN( ea ) && !window.isNaN( ex ) && (ea + ex != 0));},

	'=~':function regexp( each, regExpStr )
	{
		var regExpStrRegExp = /^\/(.*?)\/([gim]?)$/;
		var is_match = false;
		if( typeof( regExpStr ) === 'string' || regExpStr instanceof RegExp )
		{
			if( regExpStrRegExp.test( regExpStr ))
			{
				try
				{
					var matches = regExpStr.match( regExpStrRegExp );
					var regExp = new RegExp( matches[ 1 ], matches[ 2 ]);
					is_match = regExp.test( each );
				}
				catch( exc )
				{throw( exc );}
			}
			else
			{throw( new TypeError( "BooleanBinaryComparator.re 'regExpStr' must be a serialized RegExp." ));}
		}
		else
		{throw( new TypeError( "BooleanBinaryComparator.re 'regExpStr' must be a string: '".concat( regExpStr, "'." )));}
		return( is_match );
	},
};
DataFilter.BooleanBinaryComparator['!='] = function ne( each, other )
	{return( !DataFilter.BooleanBinaryComparator['==']( each, other ));};
DataFilter.BooleanBinaryComparator['!=='] = function nxeq( each, other )
	{return( !DataFilter.BooleanBinaryComparator['===']( each, other ));};
//DataFilter.BooleanBinaryComparator['!-'] = function antidifference( each, other )
//	{return( !DataFilter.BooleanBinaryComparator['-']( each, other ));};
//DataFilter.BooleanBinaryComparator['!%'] = function antimodulo( each, other )
//	{return( !DataFilter.BooleanBinaryComparator['%']( each, other ));};
//DataFilter.BooleanBinaryComparator['!*'] = function antiproduct( each, other )
//	{return( !DataFilter.BooleanBinaryComparator['*']( each, other ));};
//DataFilter.BooleanBinaryComparator['!/'] = function antiquotient( each, other )
//	{return( !DataFilter.BooleanBinaryComparator['/']( each, other ));};
//DataFilter.BooleanBinaryComparator['!+'] = function antisum( each, other )
//	{return( !DataFilter.BooleanBinaryComparator['+']( each, other ));};
DataFilter.BooleanBinaryComparator['!~'] = function antiregexp( each, other )
	{return( !DataFilter.BooleanBinaryComparator['=~']( each, other ));};
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
/*
*  1. {} objects are implicitly ANDs.  An empty array will keep truthy items.
*  2. [] arrays are implicitly ORs.  An empty object will keep falsey items.  
*		This is useful in an OR-clause to filter objects on property values 
*		where the property might not exist.
*  3. true will keep all results.  Provided as a fallback for degenerate cases.
*  4. false will keep no results.  Provided as a fallback for degenerate cases.
*  5. 'and' is an array of clauses.  Provided to inspect the same property more than once.
*  6. 'count' checks the 'length' property of the list.
*  7. 'is' is an array or object.  Provided to allow for complex clauses.  
*		Allows nesting clausing without implicitly "drilling" into the data.
*  8. 'length' checks the 'length' property of each item.
*  9. 'not' is either an array or object.  The results are negated.
* 10. 'op' is a string (from BooleanBinaryComparator) to allow for a comparison 
*		other than equality, including (serialized) regular expressions.
* 11. 'or' is an object of clauses.  Provided to truncate deep conditions.
* 12. 'subClause' is is array or object.  This is a sub-filter on nested data.  
*		This is invaluable when the real filtering needs to be done deeper 
*		than the root element without affecting ancestor filtering.
* 13. The query-by-example 'this' object is expected to be an anonymous/Object object.
*/
// Reserved where clause key values _can_ be changed if there is a conflict in 
//	the data being filtered, but this should be avoided.  To make customizing 
//	reserved keys work best, 'DataFilter' would need a constructor so not all 
//	invocations refer to a mutable set of reserved keys.
DataFilter.Keys =
{
	'AND':'and',
	'IS':'is',
	'NOT':'not',
	'OP':'op',
	'OR':'or',
	'SUB_CLAUSE':'subClause',
};
(Object.seal || Object)( DataFilter.Keys );
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
DataFilter.dataFilter = function( dataObj, whereClause )
{
	var is_array = (dataObj instanceof Array);
	var filteredData = ((is_array)?(dataObj):([dataObj]))
		.filter( DataFilter.resultsWhere, whereClause );
	var unboxedData = (is_array)
		?(filteredData)
		:((filteredData.length == 1)
			?(filteredData[ 0 ])
			:({}));
	return( unboxedData )
};
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
// For use as jQuery.ajax's 'dataFilter' option with a 'whereClause' option.
//	Requires jQuery to pass the '$.ajax' options parameter object as 'this'.
DataFilter.jQueryWhereClauseDataFilter = function( response_data, content_type )
{
	var WHERE_CLAUSE = 'whereClause';
	var filtered_data = response_data;
	if( content_type === undefined || /\bjson\b/.test( content_type ))
	{
		if( WHERE_CLAUSE in this )
		{
			var responseData = JSON.parse( response_data );
			var filteredData = DataFilter.dataFilter( responseData, this[ WHERE_CLAUSE ]);
			filtered_data = JSON.stringify( filteredData );
		}
		else
		{throw( Error( "DataFilter.jQueryWhereClauseDataFilter not provided a sibling '".concat( WHERE_CLAUSE, "' option to use." )));}
	}
	return( filtered_data );
};
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
DataFilter.resultsWhere = function( each, n, every )
{
	//DataFilter.resultsWhere._callDepth = DataFilter.resultsWhere._callDepth || 0;
	//++DataFilter.resultsWhere._callDepth;
	//function indentation()
	//{return( Array( DataFilter.resultsWhere._callDepth ).join( "\t" ));}
	//DataFilter.resultsWhere.isDebug = DataFilter.resultsWhere.isDebug || false;
	var reservedKeyByValue = Object.keys( DataFilter.Keys ).reduce( function( result, key_constant )
	{
		var reserved_key = DataFilter.Keys[ key_constant ];
		if( !window.isNaN( window.parseInt( reserved_key, 10 )))
		{throw( new Error( "DataFilter.Keys.".concat( key_constant, " cannot have an integer value." )));}
		result[ reserved_key ] = key_constant;
		return( result );
	}, {});
	function every_or_some( subject )
	{return((subject instanceof Array)?('some'):('every'));}
	function not_op_key( where_key )
	{return( where_key !== DataFilter.Keys.OP );}
	function is_plain_object( datum )
	{return( typeof( datum ) === 'object' && (datum === null || datum.constructor === Object));}
	function omit_reserved_keys( where_key )
	{return( !(where_key in reservedKeyByValue));}
	/*function keep_nested_keys( where_key )
	{return( where_key === DataFilter.Keys.AND || where_key === DataFilter.Keys.IS || where_key === DataFilter.Keys.NOT || where_key === DataFilter.Keys.OR );}*/
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
	var COUNT = 'count';
	var keeping = !(this instanceof window.constructor || this === null);
	if( keeping )
	{
		var operator = DataFilter.Keys.OP in this && this[ DataFilter.Keys.OP ] || '===';
		var comparator = ((operator in DataFilter.BooleanBinaryComparator)
			?(DataFilter.BooleanBinaryComparator[ operator ])
			:(DataFilter.BooleanBinaryComparator['===']));
		// 'this' is always promoted to a wrapped object; if a boolean, number, 
		//	or string is passed, they become a Boolean, Number, or String, respectively.
		if( this instanceof Boolean )
		{
			keeping = this.valueOf();
			//if( DataFilter.resultsWhere.isDebug )
			//{window.console.debug( indentation(), n, "Boolean", JSON.stringify( each ), "against", this, "is", keeping );}
		}
		else if( this instanceof Array )
		{
			if( this.length > 0 )
			{
				keeping = this.some( function outer_or_clause( subClause, s, subClauses )
				{
					var sub_keeping;
					//TODO what if is Array?
					if( subClause !== null && typeof( subClause ) === 'object' )//is_plain_object( subClause ))
					{
						var currData = ((each instanceof Array)?(each):([each]));
						var sub_keeper = every_or_some( subClause );
						sub_keeping = currData[ sub_keeper ]( DataFilter.resultsWhere, subClause );
					}
					else
					{
						sub_keeping = comparator( each, subClause );
					}
					return( sub_keeping );
				}, this );
				//if( DataFilter.resultsWhere.isDebug )
				//{window.console.debug( indentation(), n, "(Non-empty) array", JSON.stringify( each ), "against", this, "is", keeping );}
			}
			else
			{
				// A null object is kept by an empty array, but discarded by an empty object;
				//	a non-null object is discarded by an empty array, but kept by an empty object.
				keeping = ((this instanceof Array && this.length == 0)?(!each):(!!each));
				//if( DataFilter.resultsWhere.isDebug )
				//{window.console.debug( indentation(), n, "Empty array", JSON.stringify( each ), "against", this, "is", keeping );}
			}
		}
		else if( this !== null && is_plain_object( this ))
		{
			var sub_clause_keys = Object.keys( this ).filter( not_op_key );
			if( sub_clause_keys.length > 0 )
			{
				keeping = sub_clause_keys.every( function outer_and_clause( sub_key, s, sub_keys )
				{
					var sub_keeping;
					if( sub_key in reservedKeyByValue )
					{
						switch( sub_key )
						{
							case DataFilter.Keys.AND:
								if( this[ sub_key ] instanceof Array )
								{
									sub_keeping = this[ sub_key ].every( function explicit_and_clause( expClause, c, expClauses )
									{
										var currData = ((each instanceof Array)?(each):([each]));
										var exp_clause_keeper = every_or_some( expClause );
										var sub_sub_keeping = currData[ exp_clause_keeper ]( DataFilter.resultsWhere, expClause );
										return( sub_sub_keeping );
									}, this[ sub_key ]);
								}
								else
								{
									throw( new TypeError( "Explicit '".concat( DataFilter.Keys.AND, "' must an an array." )));
								}
								break;
							case DataFilter.Keys.IS:
								if((each !== null && is_plain_object( each )) || (each instanceof Array))
								{
									var currData = ((each instanceof Array)?(each):([each]));
									var is_clause_keeper = every_or_some( this[ DataFilter.Keys.IS ]);
									sub_keeping = currData[ is_clause_keeper ]( DataFilter.resultsWhere, this[ DataFilter.Keys.IS ]);
								}
								else
								{sub_keeping = comparator( each, this[ DataFilter.Keys.IS ]);}
								break;
							case DataFilter.Keys.NOT:
								var currData = ((each instanceof Array)?(each):([each]));
								var not_clause_keeper = every_or_some( this[ DataFilter.Keys.NOT ]);
								sub_keeping = !currData[ not_clause_keeper ]( DataFilter.resultsWhere, this[ DataFilter.Keys.NOT ]);
								break;
							case DataFilter.Keys.OR:
								if( this[ sub_key ] !== null && is_plain_object( this[ sub_key ]))
								{
									var exp_clause_keys = Object.keys( this[ sub_key ])
										.filter( not_op_key )
										/*.map( function( exp_key, e, exp_keys )
										{return( this[ exp_key ]);}, this[ sub_key ])*/;
									sub_keeping = exp_clause_keys.some( function explicit_or_clause( exp_clause_key, eck, exp_clause_keys )
									{
										var expClause = this[ exp_clause_key ];
										var sub_sub_keeping;
										//TODO what if is Array?
										if( expClause !== null && typeof( expClause ) === 'object' )//is_plain_object( expClause ))
										{
											var currData = ((each instanceof Array)?(each):([each]));
											var exp_clause_keeper = every_or_some( expClause );
											sub_sub_keeping = currData[ exp_clause_keeper ]( DataFilter.resultsWhere, expClause );
										}
										else if( exp_clause_key === COUNT )
										{sub_sub_keeping = ('length' in every && every.length == window.parseInt( this[ sub_key ], 10 ));}
										else if( exp_clause_key === 'length' )
										{sub_sub_keeping = (!!each && each.hasOwnProperty( 'length' ) && each.length == window.parseInt( this[ sub_key ], 10 ));}
										else
										{
											sub_sub_keeping = comparator( each[ exp_clause_key ], expClause );
										}
										return( sub_sub_keeping );
									}, this[ sub_key ]);
								}
								else
								{
									throw( new TypeError( "Explicit '".concat( DataFilter.Keys.OR, "' must an (anonymous and non-null) object." )));
								}
								break;
							case DataFilter.Keys.SUB_CLAUSE:
								var filtered = every.filter( DataFilter.resultsWhere, this[ DataFilter.Keys.SUB_CLAUSE ]);
								// Some implementations of Array.filter might not pass a reference to the orginal array.
								every.splice.apply( every, [0, every.length].concat( filtered ));
								sub_keeping = true;
								break;
							default:
								sub_keeping = false;
								throw( new Error( "How did we get here?".concat( sub_key )));
								break;
						}
						//if( DataFilter.resultsWhere.isDebug )
						//{window.console.debug( indentation(), n, "Object reserved key", JSON.stringify( each ), "against", this, "is", sub_keeping );}
					}
					else if( sub_key === COUNT )
					{sub_keeping = ('length' in every && every.length == window.parseInt( this[ sub_key ], 10 ));}
					else if( sub_key === 'length' )
					{sub_keeping = (!!each && each.hasOwnProperty( 'length' ) && each.length == window.parseInt( this[ sub_key ], 10 ));}
					else if( !!each )
					{
						if( sub_key in each )
						{
							if( this[ sub_key ] instanceof Array )
							{
								if( this[ sub_key ].length > 0 )
								{
									sub_keeping = this[ sub_key ].some( function inner_or_clause( subSubClause, ss, subSubClauses )
									{
										var subSubData = ((each[ sub_key ] instanceof Array)?(each[ sub_key ]):([each[ sub_key ]]));
										var sub_sub_keeper = every_or_some( subSubClause );
										var sub_sub_keeping = subSubData[ sub_sub_keeper ]( DataFilter.resultsWhere, subSubClauses );
										return( sub_sub_keeping );
									}, this[ sub_key ]);
								}
								else
								{
									// A null object is kept by an empty array, but discarded by an empty object;
									//	a non-null object is discarded by an empty array, but kept by an empty object.
									sub_keeping = ((this[ sub_key ] instanceof Array && this[ sub_key ].length == 0)?(!each[ sub_key ]):(!!each[ sub_key ]));
									//if( DataFilter.resultsWhere.isDebug )
									//{window.console.debug( indentation(), n, "Object empty array", JSON.stringify( each ), "against", this, "is", sub_keeping );}
								}
							}
							// 'each' just needs to be any kind of object.
							else if( /*this[ sub_key ] !== null &&*/ is_plain_object( this[ sub_key ]) /*&& is_plain_object( each[ sub_key ])*/)
							{
								var sub_sub_clause_keys = Object.keys( this[ sub_key ]).filter( not_op_key );
								if( !!each[ sub_key ] && sub_sub_clause_keys.length > 0 )
								{
									sub_keeping = sub_sub_clause_keys.every( function inner_and_clause( sub_sub_key, ss, sub_sub_keys )
									{
										var subSubData = ((each[ sub_key ] instanceof Array)?(each[ sub_key ]):([each[ sub_key ]]));
										var sub_sub_keeper = every_or_some( this[ sub_sub_key ]);
										var sub_sub_keeping = subSubData[ sub_sub_keeper ]( DataFilter.resultsWhere, this );
										return( sub_sub_keeping );
									}, this[ sub_key ]);
								}
								else
								{
									sub_keeping = ((this[ sub_key ] instanceof Array && this[ sub_key ].length == 0)?(!each[ sub_key ]):(!!each[ sub_key ]));
								}
							}
							else if( sub_key === COUNT )
							{sub_keeping = ('length' in every && every.length == window.parseInt( this[ sub_key ], 10 ));}
							else if( sub_key === 'length' )
							{sub_keeping = (!!each && each.hasOwnProperty( 'length' ) && each.length == window.parseInt( this[ sub_key ], 10 ));}
							else
							{sub_keeping = comparator( each[ sub_key ], this[ sub_key ]);}
							//if( DataFilter.resultsWhere.isDebug )
							//{window.console.debug( indentation(), n, "Object member key", JSON.stringify( each ), "against", this, "is", sub_keeping );}
						}
						else
						{
							if((this[ sub_key ] !== null && is_plain_object( this[ sub_key ])) || (this[ sub_key ] instanceof Array))
							{
								// each[ sub_key ] will be 'undefined'.
								var subData = ((each[ sub_key ] instanceof Array)?(each[ sub_key ]):([each[ sub_key ]]));
								var sub_keeper = every_or_some( this[ sub_key ]);
								sub_keeping = subData[ sub_keeper ]( DataFilter.resultsWhere, this[ sub_key ]);
							}
							else
							{sub_keeping = false;}
							//if( DataFilter.resultsWhere.isDebug )
							//{window.console.debug( indentation(), n, "Object non-existent key", JSON.stringify( each ), "against", this, "is", sub_keeping );}
						}
					}
					else
					{
						// A null object is kept by an empty array, but discarded by an empty object;
						//	a non-null object is discarded by an empty array, but kept by an empty object.
						sub_keeping = ((this instanceof Array && this.length == 0)?(!each):(!!each));
						//if( DataFilter.resultsWhere.isDebug )
						//{window.console.debug( indentation(), n, "Null data", JSON.stringify( each ), "against", this, "is", keeping );}
					}
					return( sub_keeping );
				}, this );
			}
			else
			{
				// A null object is kept by an empty array, but discarded by an empty object;
				//	a non-null object is discarded by an empty array, but kept by an empty object.
				keeping = ((this instanceof Array && this.length == 0)?(!each):(!!each));
				//if( DataFilter.resultsWhere.isDebug )
				//{window.console.debug( indentation(), n, "Empty (anoymous) object", JSON.stringify( each ), "against", this, "is", keeping );}
			}
		}
		else
		{throw( new TypeError( "Clauses must be arrays or (anonymous and non-null) objects (or booleans, numbers, or strings)." ));}
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
	}// if( this instanceof window.constructor )
	else
	{
		//if( DataFilter.resultsWhere.isDebug )
		//{window.console.debug( indentation(), n, "Whatever", 'window', "says", JSON.stringify( each ), "is", keeping );}
	}
	//--DataFilter.resultsWhere._callDepth;
	return( keeping );
};
//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=//
return( DataFilter );
})( window );