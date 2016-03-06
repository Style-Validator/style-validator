var launcher = require( 'browser-launcher2' );

launcher( function( err, launch ) {
	if ( err ) {
		return console.error( err );
	}

	launch( 'http://cksource.com/', 'chrome', function( err, instance ) {
		if ( err ) {
			return console.error( err );
		}

		console.log( 'Instance started with PID:', instance.pid );

		instance.on( 'stop', function( code ) {
			console.log( 'Instance stopped with exit code:', code );
		} );
	} );
} );