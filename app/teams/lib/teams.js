import { Mongo } from 'meteor/mongo';

const Teams = new Mongo.Collection('rocketchat_teams');

export { Teams }