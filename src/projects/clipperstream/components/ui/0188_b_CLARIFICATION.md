[{
	"resource": "/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/hooks/useOfflineRecording.ts",
	"owner": "typescript",
	"code": "2367",
	"severity": 8,
	"message": "This comparison appears to be unintentional because the types '\"transcribing\" | \"formatting\" | \"pending-child\" | \"pending-retry\" | \"failed\"' and '\"pending\"' have no overlap.",
	"source": "ts",
	"startLineNumber": 85,
	"startColumn": 18,
	"endLineNumber": 85,
	"endColumn": 50,
	"modelVersionId": 48
},{
	"resource": "/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/hooks/useOfflineRecording.ts",
	"owner": "typescript",
	"code": "2345",
	"severity": 8,
	"message": "Argument of type 'import(\"/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/store/clipStore\").Clip[]' is not assignable to parameter of type 'import(\"/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/services/clipStorage\").Clip[]'.\n  Type 'import(\"/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/store/clipStore\").Clip' is not assignable to type 'import(\"/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/services/clipStorage\").Clip'.\n    Types of property 'status' are incompatible.\n      Type 'ClipStatus' is not assignable to type '\"transcribing\" | \"pending-child\" | \"failed\" | \"pending\" | null'.\n        Type '\"formatting\"' is not assignable to type '\"transcribing\" | \"pending-child\" | \"failed\" | \"pending\" | null'.",
	"source": "ts",
	"startLineNumber": 112,
	"startColumn": 49,
	"endLineNumber": 112,
	"endColumn": 59,
	"modelVersionId": 48
},{
	"resource": "/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/hooks/useOfflineRecording.ts",
	"owner": "typescript",
	"code": "2741",
	"severity": 8,
	"message": "Property 'formattedText' is missing in type '{ id: string; title: string; date: string; status: null; content: string; rawText: string; currentView: \"formatted\"; createdAt: number; }' but required in type 'Clip'.",
	"source": "ts",
	"startLineNumber": 114,
	"startColumn": 13,
	"endLineNumber": 114,
	"endColumn": 23,
	"relatedInformation": [
		{
			"startLineNumber": 32,
			"startColumn": 3,
			"endLineNumber": 32,
			"endColumn": 16,
			"message": "'formattedText' is declared here.",
			"resource": "/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/store/clipStore.ts"
		}
	],
	"modelVersionId": 48
},{
	"resource": "/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/hooks/useOfflineRecording.ts",
	"owner": "typescript",
	"code": "2739",
	"severity": 8,
	"message": "Type '{ id: string; title: string; date: string; status: \"pending-child\"; content: string; pendingClipTitle: string; audioId: string; duration: string; parentId: string; currentView: \"formatted\"; createdAt: number; }' is missing the following properties from type 'Clip': rawText, formattedText",
	"source": "ts",
	"startLineNumber": 140,
	"startColumn": 13,
	"endLineNumber": 140,
	"endColumn": 23,
	"modelVersionId": 48
},{
	"resource": "/Users/ethan/Documents/projects/final-exp/src/projects/clipperstream/hooks/useOfflineRecording.ts",
	"owner": "typescript",
	"code": "2739",
	"severity": 8,
	"message": "Type '{ id: string; title: string; date: string; status: \"pending-child\"; content: string; pendingClipTitle: string; audioId: string; duration: string; parentId: string; currentView: \"formatted\"; createdAt: number; }' is missing the following properties from type 'Clip': rawText, formattedText",
	"source": "ts",
	"startLineNumber": 202,
	"startColumn": 13,
	"endLineNumber": 202,
	"endColumn": 22,
	"modelVersionId": 48
}]