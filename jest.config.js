module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/tests'],
	testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	collectCoverageFrom: [
		'nodes/Lexware/GenericFunctions.ts',
		'nodes/Lexware/actions/Contacts.execute.ts',
		'nodes/Lexware/actions/Dunnings.execute.ts',
		'nodes/Lexware/actions/VoucherLists.execute.ts',
		'nodes/Lexware/actions/Files.execute.ts',
		'nodes/Lexware/actions/Quotations.execute.ts',
		'nodes/Lexware/utils/**/*.ts',
		'credentials/**/*.ts',
		'!**/*.d.ts',
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	moduleFileExtensions: ['ts', 'js', 'json'],
	setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
