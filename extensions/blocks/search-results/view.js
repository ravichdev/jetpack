/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import { SERVER_OBJECT_NAME } from '../../../modules/search/instant-search/lib/constants';
import store from '../../../modules/search/instant-search/store';
import SearchResults from '../../../modules/search/instant-search/components/search-results-fork';
import './view.scss';

/**
 * Initialize search results.
 *
 * @param {HTMLElement} block - DOM element
 */
const initializeBlock = function ( block ) {
	// Grab the query from ?search= (avoids conflict with existing Instant Search)
	const urlParams = new URLSearchParams( window.location.search );
	const query = urlParams.get( 'search' );

	render(
		<SearchResults
			enableLoadOnScroll={ false }
			hasNextPage={ false }
			highlightColor={ window[ SERVER_OBJECT_NAME ].overlayOptions.highlightColor }
			isVisible
			locale={ window[ SERVER_OBJECT_NAME ].locale }
			onLoadNextPage={ () => null }
			query={ query }
			resultFormat={ window[ SERVER_OBJECT_NAME ].overlayOptions.resultFormat }
			store={ store }
		/>,
		block
	);
};

document
	.querySelectorAll( '.wp-block-jetpack-search-results:not([data-jetpack-block-initialized])' )
	.forEach( block => {
		initializeBlock( block );
	} );
