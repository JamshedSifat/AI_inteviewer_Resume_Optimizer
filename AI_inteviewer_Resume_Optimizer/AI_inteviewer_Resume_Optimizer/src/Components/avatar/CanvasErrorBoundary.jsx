import { Component } from "react";

/**
 * CanvasErrorBoundary
 * --------------------
 * WebGL/Three.js failures (unsupported browser, driver issues, blocked
 * HDRI/environment fetches, context loss) should never take down the rest
 * of the interview UI. This boundary catches render errors from the 3D
 * avatar and swaps in a simple animated placeholder instead.
 */
export default class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[AIAvatarCanvas] 3D render failed, falling back:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/20 animate-pulse" />
          </div>
        )
      );
    }
    return this.props.children;
  }
}
