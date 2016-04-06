# DataFilter
The idea is simple: filter data in JavaScript using the native filtering (Array.prototype.filter) in a descriptive/declarative way uxing JSON.  The implementation is less trivial.

# Tenets
1. {} objects are implicitly ANDs.  An empty array will keep "truthy" items.
2. [] arrays are implicitly ORs.  An empty object will keep "falsey" items.  
	This is useful in an OR-clause to filter objects on property values 
	where the property might not exist.
3. `true` will keep all results.  Provided as a fallback for degenerate cases.
4. `false` will keep no results.  Provided as a fallback for degenerate cases.
5. 'and' is an array of clauses.  Provided to inspect the same property more than once.
6. 'count' checks the 'length' property of the list.
7. 'is' is an array or object.  Provided to allow for complex clauses.  
	Allows nested clauses without implicitly "drilling" into the data.
8. 'length' checks the 'length' property of each item.
9. 'not' is either an array or object.  The results are negated.
10. 'op' is a string (from BooleanBinaryComparator) to allow for a comparison 
	other than (strict) equality, including (serialized) regular expressions.
11. 'or' is an object of clauses.  Provided to truncate deep conditions.
12. 'subClause' is an array or object.  This is a sub-filter on nested data.  
	This is invaluable when the real filtering needs to be done deeper 
	than the root element without affecting ancestor (or ancestor sibling) filtering.
13. The query-by-example 'this' object is expected to be an anonymous/Object object.  This requirement might be removed in the future.
14. Provide a `DataFilter.dataFilter( data, whereClause )` to handle array boxing and unboxing of non-array data.
15. Provide a `DataFilter.jQueryWhereClauseDataFilter( response_data, content_type )` for use with `jQuery.ajax`.

# Examples
Example #1: Flitering an Array of Data
----------
```JavaScript
var original = 
[
  {
  	'list':
  	[
  		{'a':{'b':'3', 'c':"hi"}}, 
  		null, 
  		{'a':{'c':"bye"}}, 
  		{'a':null}
  	],
  	'sibling':"property"
  }
];
```
Statically define, build from user input, retrieve from a web service, etc. a where clause.
```JavaScript
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
```
Perform the filtering.
```JavaScript
// #5: Wrap the object in an anonymous array so it can be processed in a list.
var filtered = original.filter( DataFilter.resultsWhere, whereClause );
```
Filtered results now contains (serialized for clarity):
```JavaScript
[
	{
		"list":
		[
			{
				"a":
				{
					"b": "3",
					"c": "hi"
				}
			}
		],
		"sibling": "property"
	}
]
```
Example #2: Filtering Ajax Data
----------
Set `jQuery.ajax` `dataFilter` option to `DataFilter.jQueryWhereClauseDataFilter` and add `whereClause` query definition.
```JavaScript
var getOptions = 
{
	'method':'GET',
	'dataFilter':DataFilter.jQueryWhereClauseDataFilter,
	'whereClause':{"list":{"subClause":{"not":[[],{"a":[]},{"a":{"c":"bye"}}]}}},
};
```
```JavaScript
$.ajax( url, getOptions )
.done( function( responseData, status_text, jqXHR )
{})
.fail( function( jqXHR, status_text, error_thrown )
{});
```
