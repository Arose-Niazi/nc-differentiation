# Numerical Differentiation Calculator

A web-based calculator for numerical differentiation with step-by-step solutions.

## Methods

- **Newton's Forward Difference Formula** — Best for differentiating near the beginning of the data table
- **Newton's Backward Difference Formula** — Best for differentiating near the end of the data table
- **Stirling's Central Difference Formula** — Best for differentiating near the center of the data table
- **Finite Difference Methods** — Forward, backward, and central difference approximations

## Features

- Tabular data points or function f(x) input
- Step-by-step solutions with difference tables
- First and second derivative computation
- Error estimation
- Compare mode (side-by-side methods)
- Dark/light theme
- Responsive design
- Calculation history
- Share links
- LaTeX export
- Print-friendly output

## Tech Stack

- Vanilla HTML, CSS, JavaScript
- [math.js](https://mathjs.org/) for function evaluation
- Nginx + Docker for deployment

## Development

Open `index.html` in a browser. No build step required.

## Deployment

```bash
docker compose up -d --build
```

## License

MIT

## Author

[Arose Niazi](https://arose-niazi.me)
