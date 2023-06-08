/// <reference types="cypress" />

describe('mindgraph visual tests', () => {
  it('canvas with width 100% scales bitmap width to width of screen', () => {
    cy.viewport(1000, 660);
    cy.visit('http://localhost:5173');
    // Disabling no-unnecessary-waiting:
    //   We need to wait for the draw library to detect the DOM is loaded, and for it to start rendering the simulation.
    //   There is probably a cleaner way, but this works for now
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    const expectedWidth = window.devicePixelRatio * 1000;
    cy.get('#app').should('have.attr', 'width', expectedWidth);
    cy.compareSnapshot('full-width-canvas', 0.1);
  });

  it('canvas with hardcoded width of 400px maintains aspect ratio with bitmap', () => {
    cy.visit('http://localhost:5173/tests/test2.html');
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    const expectedWidth = window.devicePixelRatio * 400;
    cy.get('#app').should('have.attr', 'width', expectedWidth);
    cy.compareSnapshot('400-px-width-canvas', 0.1);
  });
});
