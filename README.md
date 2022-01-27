# GU-key

Vorschlag für einen Schlüssel zur Kodierung harmonisierter Geologischer Einheiten (GU-key)
Der GU-key beschreibt eine nach INSPIRE harmonisierte Geologische Einheit und enthält die Nummern der URIs aus dem GBA Thesaurus. Damit soll eine Verwendung der harmonisierten Information nach INSPIRE auch außerhalb von Datenbanksystemen (z.B. Webapplikationen und JavaScript) erleichtert werden.  
  
Beispiel: ```g120-g23-t20-rl158-l44-ra26-a35-a34-p50-e12-TN```  
Reihenfolge: **Geol., Tekt., Lithology, Geol. Event, Desc. purpose**  
  
## 1) Kodierung  
  
- Bedeutung der Buchstaben-Kürzel in der festgelegten Reihenfolge:

```
g.. geologische Einheit (Name)  
t.. tektonische Einheit (Name)  
*rl.. lithologischer Haupt-Bestandteil (representative lithology value),   
l.. lithologischer (Neben-)Bestandteil (present lithology)  
*ra.. Alter (representative age)  
a.. älteres Alter, jüngeres Alter,  
p.. Event-Process,  
e.. Event-Environment  
*DN..defining norm / TN.. typical norm / IN.. instance  
  
*.. Kodierung darf nur einmal vorkommen  
```

- die Trennung der einzelnen Attribute erfolgt durch Bindestriche (minus), und muss mit einem “Description Purpose” zB. ```-TN``` (für typical norm) abgeschlossen werden  
- die Buchstaben-Kürzel werden mit der betreffenden Nummer der Concept-URI vom GBA Thesaurus kombiniert, zB ```rl158-```, für Sedimentäres Material (<http://resource.geolba.ac.at/lithology/158> vom „GBA Lithologie Thesaurus“)  
- bei Mehrfach-Einträgen (zusammengesetzte Einheiten) werden die Codes hintereinander geschrieben, zB zwei Geologische Formationen ```g120-g23-```, oder mehrere lithologische (Neben-)Bestandteile ```l44-l45-```  
- bei Geol. Event Alter sowie bei "Representative Lithology" kann max. 1 Eintrag "representative" angegeben werden.  
  
## 2) Anwendung

- aus dem GU-key kann ein kompletter Legendentext (Deutsch oder Englisch) automatisiert erstellt werden, welcher den „harmonisierten“ Inhalt einer Geologischen Einheit nach INSPIRE beschreibt  
- er könnte zB in Webkarten, Profilbeschreibungen, Kartierungspunkten oder für Bohrabschnitte verwendet werden, ohne gleich ein komplettes Datenbanksystem mitzuführen.  
- der GU-key kann in Datenbank Systemen (SQL, concat) automatisiert in einer eigenen zusätzlichen Tabellenspalte erstellt werden, und kodiert dabei mehrere verbundene Tabellen in einen definierten Text (String). Umgekehrt könnte aus dem GU-key eine Datenbankstruktur befüllt werden  
- die Kodierung kann auch als Schlüssel im Sinne einer (sortierbaren) Generallegende(?) verwendet werden.  
- Abfragen von WFS Services nach bestimmten Attributen sollten möglich sein  
- Import in Excel mit leichten Modifikationen (zB Spaltentrennung nach g, t, rl, ra) sollte möglich sein  
  
## 3) Validierung  

- eine Validierung kann praktisch über eine Website in JavaScript erfolgen, ebenso wie der GU-key auch in Webkarten und Linked Data als validierte Definition eines Legendeneintrags verwendet werden kann  
- der GU-key darf keine Leerzeichen enthalten und muss mit ```-DN``` (od. ```-TN, -IN```) abgeschlossen werden  
- ```rl..``` Lithologischer Haupt-Bestandteil darf nur einmal vorkommen  
- ```ra..``` representative Age darf nur einmal vorkommen  
- ein gültiger Key muss, bei nicht vollständig harmonisierten Einträgen, nicht alle Attribute enthalten (zB. nur ```g952-DN``` für „Zollner Formation“ oder ```pa26-IN``` für Mesozoikum)  
- die Reihenfolge der Attribute, wie unter 1) Kodierung beschrieben, muss aber jedenfalls, u.a. wegen der Identifizierbarkeit von Mehrfach-Einträgen, eingehalten werden  
  
## 4) GeoSciML Geologic Unit  

![class diagram](http://www.onegeology.org/service_provision/_images/image001.jpg)  
