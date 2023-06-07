/// <reference types="cypress" />

describe('mindgraph visual tests', () => {
  it('canvas with width 100% scales bitmap width to width of screen', () => {
    cy.viewport(1000, 660);
    cy.visit('http://localhost:5173');
    cy.wait(500);
    let canvasElement = cy.get('#app');
    canvasElement.should('have.attr', 'width', '1000');
    cy.compareSnapshot('full-width-canvas', 0.1);
  });

  it('canvas with hardcoded width of 400px maintains aspect ratio with bitmap', () => {
    cy.visit('http://localhost:5173/tests/test2.html');
    cy.wait(500);
    let canvasElement = cy.get('#app');
    canvasElement.should('have.attr', 'width', '400');
    cy.compareSnapshot('400-px-width-canvas', 0.1);
  });
});
