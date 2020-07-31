/**
 * External dependencies
 */
import waitMediaReady from './lib/wait-media-ready';

/**
 * WordPress dependencies
 */
import { createElement, useLayoutEffect, useEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Media } from './components';

export const Slide = ( {
	media,
	index,
	currentSlideIndex,
	playing,
	ended,
	muted,
	onEnd,
	onProgress,
	settings,
} ) => {
	const visible = index === currentSlideIndex;
	const currentSlidePlaying = visible && playing;
	const mediaRef = useRef( null );
	const [ preload, setPreload ] = useState( false );
	const [ loading, setLoading ] = useState( true );
	const isVideo = () => mediaRef.current && mediaRef.current.tagName.toLowerCase() === 'video';

	const [ progressState, updateProgressState ] = useState( {
		currentTime: 0,
		duration: null,
		timeout: null,
	} );

	// Sync playing state with underlying HTMLMediaElement
	useEffect( () => {
		if ( isVideo() ) {
			if ( currentSlidePlaying ) {
				mediaRef.current.play();
			} else {
				mediaRef.current.pause();
			}
		}
	}, [ currentSlidePlaying ] );

	// Display end of video on last slide when story ends
	useLayoutEffect( () => {
		if ( isVideo() && ended && visible ) {
			mediaRef.current.currentTime = mediaRef.current.duration;
		}
	}, [ ended, visible ] );

	// Sync muted state with underlying HTMLMediaElement
	useEffect( () => {
		if ( isVideo() ) {
			mediaRef.current.muted = muted;
			if ( ! muted ) {
				mediaRef.current.volume = settings.volume;
			}
		}
	}, [ muted ] );

	// Reset progress state for slides that aren't being displayed
	useEffect( () => {
		if ( ! visible ) {
			updateProgressState( {
				currentTime: 0,
				duration: null,
				timeout: null,
				lastUpdate: null,
			} );
			if ( isVideo() ) {
				mediaRef.current.pause();
				mediaRef.current.currentTime = 0;
			}
		}
	}, [ visible ] );

	// Reset progress on replay for stories with one slide
	useEffect( () => {
		if ( currentSlidePlaying && ended ) {
			updateProgressState( {
				currentTime: 0,
				duration: null,
				timeout: null,
				lastUpdate: null,
			} );
			if ( isVideo() ) {
				mediaRef.current.currentTime = 0;
			}
		}
	}, [ currentSlidePlaying, ended ] );

	// Sync progressState with underlying media playback progress
	useLayoutEffect( () => {
		clearTimeout( progressState.timeout );
		if ( loading ) {
			return;
		}
		if ( playing && visible ) {
			const video = isVideo() ? mediaRef.current : null;
			const duration = video ? video.duration : settings.imageTime;
			if ( progressState.currentTime >= duration ) {
				return;
			}
			progressState.timeout = setTimeout( () => {
				const delta = progressState.lastUpdate
					? Date.now() - progressState.lastUpdate
					: settings.renderInterval;
				const currentTime = video ? video.currentTime : progressState.currentTime + delta;
				updateProgressState( {
					...progressState,
					lastUpdate: Date.now(),
					duration,
					currentTime,
				} );
			}, settings.renderInterval );
		}
		const paused = visible && ! playing;
		if ( paused && progressState.lastUpdate ) {
			updateProgressState( {
				...progressState,
				lastUpdate: null,
			} );
		}
	}, [ loading, playing, visible, progressState ] );

	// Watch progressState and trigger events using onProgress and onEnd callbacks
	useEffect( () => {
		if ( ! currentSlidePlaying || ended || progressState.duration === null ) {
			return;
		}
		const percentage = Math.round( ( 100 * progressState.currentTime ) / progressState.duration );
		if ( percentage >= 100 ) {
			onProgress( 100 );
			onEnd();
		} else {
			onProgress( percentage );
		}
	}, [ currentSlidePlaying, visible, progressState ] );

	useEffect( () => {
		if ( index <= currentSlideIndex + ( playing ? 1 : 0 ) ) {
			setPreload( true );
		}
	}, [ playing, currentSlideIndex ] );

	// Sync media loading
	useLayoutEffect( () => {
		if ( ! mediaRef.current ) {
			return;
		}
		waitMediaReady( mediaRef.current ).then( () => {
			setLoading( false );
		} );
	}, [ preload ] );

	return (
		<>
			{ /* spinner from wp-calypso components */ }
			{ visible && loading && (
				<div className="wp-story-slide is-loading">
					<div className="spinner">
						<div className="spinner__outer">
							<div className="spinner__inner" />
						</div>
					</div>
				</div>
			) }
			<div
				className="wp-story-slide"
				style={ { display: visible && ! loading ? 'block' : 'none' } }
			>
				{ preload && <Media { ...media } index={ index } mediaRef={ mediaRef } /> }
			</div>
		</>
	);
};

export default Slide;
